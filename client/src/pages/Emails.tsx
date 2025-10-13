import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Mail, MoreVertical, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Emails() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const { toast } = useToast();

  const { data: emails, isLoading } = useQuery({
    queryKey: ["/api/emails", { type: typeFilter, search }],
  });

  const generateResponseMutation = useMutation({
    mutationFn: async (emailId: string) => {
      return await apiRequest("POST", `/api/emails/${emailId}/generate-response`, {});
    },
    onSuccess: (data) => {
      setSelectedEmail({ ...selectedEmail, suggestedResponse: data.response });
      setShowResponseDialog(true);
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer une réponse automatique",
        variant: "destructive",
      });
    },
  });

  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case "devis":
        return "bg-chart-1/10 text-chart-1 border-chart-1/20";
      case "facture":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "rdv":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Emails</h1>
        <p className="text-sm text-muted-foreground">
          Gestion et analyse intelligente de vos emails
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-email"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-email-type">
            <SelectValue placeholder="Type d'email" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="devis">Devis</SelectItem>
            <SelectItem value="facture">Facture</SelectItem>
            <SelectItem value="rdv">Rendez-vous</SelectItem>
            <SelectItem value="general">Général</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Email List */}
      <Card className="divide-y divide-border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : emails && emails.length > 0 ? (
          emails.map((email: any) => (
            <div
              key={email.id}
              className="p-4 hover-elevate cursor-pointer"
              onClick={() => setSelectedEmail(email)}
              data-testid={`email-${email.id}`}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="text-xs">
                    {email.from?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{email.from}</span>
                        {email.emailType && (
                          <Badge variant="outline" className={`text-xs ${getEmailTypeColor(email.emailType)}`}>
                            {email.emailType}
                          </Badge>
                        )}
                        {email.priority && email.priority !== "normal" && (
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(email.priority)}`}>
                            {email.priority}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm font-semibold mt-1">{email.subject}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(email.receivedAt), "dd MMM", { locale: fr })}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {email.body?.substring(0, 150)}...
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Aucun email trouvé</p>
          </div>
        )}
      </Card>

      {/* Email Detail Dialog */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedEmail?.subject}</DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-sm">
              <span>De: {selectedEmail?.from}</span>
              {selectedEmail?.receivedAt && (
                <span className="text-muted-foreground">
                  • {format(new Date(selectedEmail.receivedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* AI Analysis */}
            {selectedEmail?.aiAnalysis && (
              <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Analyse IA</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedEmail.aiAnalysis.summary || "Analyse en cours..."}
                </p>
              </div>
            )}

            {/* Email Body */}
            <div className="prose prose-sm max-w-none">
              <div className="text-sm whitespace-pre-wrap">{selectedEmail?.body}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => generateResponseMutation.mutate(selectedEmail?.id)}
                disabled={generateResponseMutation.isPending}
                data-testid="button-generate-response"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer une réponse
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Réponse générée par IA</DialogTitle>
            <DialogDescription>
              Vous pouvez modifier la réponse avant de l'envoyer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={selectedEmail?.suggestedResponse || ""}
              onChange={(e) =>
                setSelectedEmail({ ...selectedEmail, suggestedResponse: e.target.value })
              }
              rows={8}
              data-testid="textarea-response"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                Annuler
              </Button>
              <Button data-testid="button-approve-response">Approuver et envoyer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
