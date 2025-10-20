import { useState, useEffect } from "react";
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
import { Search, Mail, MoreVertical, Sparkles, Check, X, MailCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useLocation } from "wouter";

export default function Emails() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [showPromptInput, setShowPromptInput] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Load email categories dynamically
  const { data: emailCategories } = useQuery<any>({
    queryKey: ["/api/email-categories"],
  });
  
  // Read category and status from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const status = params.get('status');
    if (category) {
      setTypeFilter(category);
    }
    if (status) {
      setStatusFilter(status);
    }
  }, [location]);

  const { data: rawEmails, isLoading } = useQuery({
    queryKey: ["/api/emails", { type: typeFilter, status: statusFilter, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (search) params.append('search', search);
      
      const url = `/api/emails${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return res.json();
    },
  });

  // Sort emails: unprocessed (nouveau) first, then by received date
  const emails = rawEmails ? [...rawEmails].sort((a, b) => {
    // First, sort by status: "nouveau" comes first
    if (a.status === 'nouveau' && b.status !== 'nouveau') return -1;
    if (a.status !== 'nouveau' && b.status === 'nouveau') return 1;
    
    // Then sort by received date (most recent first)
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  }) : [];

  const generateResponseMutation = useMutation({
    mutationFn: async ({ emailId, customPrompt }: { emailId: string; customPrompt?: string }) => {
      // Only send customPrompt if it has actual content (not empty string)
      const promptToSend = customPrompt && customPrompt.trim().length > 0 ? customPrompt.trim() : undefined;
      
      const res = await apiRequest("POST", `/api/emails/${emailId}/generate-response`, {
        ...(promptToSend && { customPrompt: promptToSend }),
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Update selected email with the generated response
      setSelectedEmail({ ...selectedEmail, suggestedResponse: data.response });
      setShowResponseDialog(true);
      // Clear custom prompt and hide input after successful generation
      setCustomPrompt("");
      setShowPromptInput(false);
      // Invalidate queries to refresh email list with updated suggestedResponse
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      
      // Determine if custom prompt was actually used
      const usedCustomPrompt = variables.customPrompt && variables.customPrompt.trim().length > 0;
      
      toast({
        title: "Succès",
        description: usedCustomPrompt 
          ? "Réponse générée selon vos instructions" 
          : "Réponse générée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer une réponse automatique",
        variant: "destructive",
      });
    },
  });

  const markProcessedMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const res = await apiRequest("PATCH", `/api/emails/${emailId}/mark-processed`, {});
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats/by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Succès",
        description: "Email marqué comme traité",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de marquer l'email comme traité",
        variant: "destructive",
      });
    },
  });

  const sendResponseMutation = useMutation({
    mutationFn: async ({ emailId, responseText }: { emailId: string; responseText: string }) => {
      const res = await apiRequest("POST", `/api/emails/${emailId}/send-response`, { responseText });
      return res.json();
    },
    onSuccess: (data) => {
      // Close the response dialog
      setShowResponseDialog(false);
      // Update selected email to reflect sent status
      setSelectedEmail(data.email);
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      toast({
        title: "Succès",
        description: "Réponse envoyée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({ emailIds, status }: { emailIds: string[]; status: string }) => {
      const res = await apiRequest("PATCH", "/api/emails/bulk/update-status", { emailIds, status });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats/by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      const statusLabels: Record<string, string> = {
        nouveau: "nouveau",
        en_cours: "en cours",
        traite: "traité",
        archive: "archivé",
      };
      
      if (data.failed > 0 && data.failedIds) {
        // Partial failure - keep only failed emails selected for retry
        setSelectedEmailIds(data.failedIds);
        toast({
          title: "Traitement partiel",
          description: `${data.updated} email(s) mis à jour, ${data.failed} échoué(s). Les emails non traités restent sélectionnés.`,
          variant: "destructive",
        });
      } else {
        // Full success - clear selection
        setSelectedEmailIds([]);
        toast({
          title: "Succès",
          description: `${data.updated} email(s) marqué(s) comme ${statusLabels[data.status] || data.status}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le statut des emails",
        variant: "destructive",
      });
    },
  });

  const bulkMarkProcessedMutation = useMutation({
    mutationFn: async (emailIds: string[]) => {
      const res = await apiRequest("PATCH", "/api/emails/bulk/mark-processed", { emailIds });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/stats/by-category"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      if (data.failed > 0 && data.failedIds) {
        // Partial failure - keep only failed emails selected for retry
        setSelectedEmailIds(data.failedIds);
        toast({
          title: "Traitement partiel",
          description: `${data.processed} email(s) traité(s), ${data.failed} échoué(s). Les emails non traités restent sélectionnés.`,
          variant: "destructive",
        });
      } else {
        // Full success - clear selection
        setSelectedEmailIds([]);
        toast({
          title: "Succès",
          description: `${data.processed} email(s) marqué(s) comme traité(s)`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de marquer les emails comme traités",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "nouveau":
        return "bg-chart-2/10 text-chart-2 border-chart-2/20";
      case "en_cours":
        return "bg-chart-3/10 text-chart-3 border-chart-3/20";
      case "traite":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "archive":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "nouveau":
        return "Nouveau";
      case "en_cours":
        return "En cours";
      case "traite":
        return "Traité";
      case "archive":
        return "Archivé";
      default:
        return status;
    }
  };

  const handleSelectEmail = (emailId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmailIds([...selectedEmailIds, emailId]);
    } else {
      setSelectedEmailIds(selectedEmailIds.filter(id => id !== emailId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && emails) {
      setSelectedEmailIds(emails.map((email: any) => email.id));
    } else {
      setSelectedEmailIds([]);
    }
  };

  const handleBulkMarkProcessed = () => {
    if (selectedEmailIds.length > 0) {
      bulkMarkProcessedMutation.mutate(selectedEmailIds);
    }
  };

  const handleBulkUpdateStatus = (status: string) => {
    if (selectedEmailIds.length > 0) {
      bulkUpdateStatusMutation.mutate({ emailIds: selectedEmailIds, status });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Emails</h1>
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
            {emailCategories?.map((category: any) => (
              <SelectItem key={category.key} value={category.key}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-email-status">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="non_traite">Non traités</SelectItem>
            <SelectItem value="traite">Traités</SelectItem>
            <SelectItem value="nouveau">Nouveau</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="archive">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedEmailIds.length > 0 && (
        <Card className="p-3 md:p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {selectedEmailIds.length} email(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmailIds([])}
                disabled={bulkUpdateStatusMutation.isPending}
                data-testid="button-clear-selection"
              >
                <X className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Désélectionner</span>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {bulkUpdateStatusMutation.isPending ? (
                <span className="text-xs md:text-sm text-muted-foreground">Mise à jour...</span>
              ) : (
                <span className="text-xs md:text-sm text-muted-foreground w-full md:w-auto">Changer le statut :</span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateStatus('nouveau')}
                disabled={bulkUpdateStatusMutation.isPending}
                data-testid="button-bulk-mark-nouveau"
                className="flex-1 md:flex-none"
              >
                <Mail className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Nouveau</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateStatus('en_cours')}
                disabled={bulkUpdateStatusMutation.isPending}
                data-testid="button-bulk-mark-en-cours"
                className="flex-1 md:flex-none"
              >
                <span className="text-xs sm:text-sm">En cours</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleBulkUpdateStatus('traite')}
                disabled={bulkUpdateStatusMutation.isPending}
                data-testid="button-bulk-mark-traite"
                className="flex-1 md:flex-none"
              >
                <Check className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Traité</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateStatus('archive')}
                disabled={bulkUpdateStatusMutation.isPending}
                data-testid="button-bulk-mark-archive"
                className="flex-1 md:flex-none"
              >
                <span className="text-xs sm:text-sm">Archivé</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Email List */}
      <Card className="divide-y divide-border">
        {/* Select All Header */}
        {emails && emails.length > 0 && (
          <div className="p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={emails.length > 0 && selectedEmailIds.length === emails.length}
                onCheckedChange={handleSelectAll}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm text-muted-foreground">
                Tout sélectionner
              </span>
            </div>
          </div>
        )}
        
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
              className={`p-3 md:p-4 hover-elevate ${
                email.status === 'nouveau' 
                  ? 'border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10' 
                  : ''
              }`}
              data-testid={`email-${email.id}`}
            >
              <div className="flex items-start gap-2 md:gap-4">
                <Checkbox
                  checked={selectedEmailIds.includes(email.id)}
                  onCheckedChange={(checked) => handleSelectEmail(email.id, checked as boolean)}
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`checkbox-email-${email.id}`}
                  className="mt-2 md:mt-3 flex-shrink-0"
                />
                <div 
                  className="flex items-start gap-2 md:gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => setSelectedEmail(email)}
                >
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {email.from?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium truncate max-w-[150px] md:max-w-none">{email.from}</span>
                          {email.respondedAt && (
                            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex-shrink-0" data-testid={`badge-responded-${email.id}`}>
                              <Check className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Répondu</span>
                            </Badge>
                          )}
                          {email.status && (
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${getStatusColor(email.status)}`} data-testid={`badge-status-${email.id}`}>
                              {getStatusLabel(email.status)}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-semibold line-clamp-1 md:line-clamp-none">{email.subject}</div>
                        <div className="flex items-center gap-1 md:gap-2 flex-wrap mt-1 md:hidden">
                          {email.emailType && (
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${getEmailTypeColor(email.emailType)}`}>
                              {email.emailType}
                            </Badge>
                          )}
                          {email.priority && email.priority !== "normal" && (
                            <Badge variant="outline" className={`text-xs flex-shrink-0 ${getPriorityColor(email.priority)}`}>
                              {email.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(email.receivedAt), "dd MMM", { locale: fr })}
                        </span>
                        {email.status !== 'traite' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              markProcessedMutation.mutate(email.id);
                            }}
                            disabled={markProcessedMutation.isPending}
                            data-testid={`button-mark-processed-${email.id}`}
                            title="Marquer comme traité"
                          >
                            <MailCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 flex-wrap mb-2">
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {email.body?.substring(0, 150)}...
                    </p>
                  </div>
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto w-[95vw] md:w-full">
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

            {/* Suggested Response */}
            {selectedEmail?.suggestedResponse && (
              <div className="p-4 rounded-md bg-chart-2/5 border border-chart-2/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-chart-2" />
                  <span className="text-sm font-medium">Réponse suggérée par IA</span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedEmail.suggestedResponse}
                </p>
              </div>
            )}

            {/* Email Body */}
            <div className="prose prose-sm max-w-none">
              <div className="text-sm whitespace-pre-wrap">{selectedEmail?.body}</div>
            </div>

            {/* Custom Prompt Input */}
            {!selectedEmail?.suggestedResponse && showPromptInput && (
              <div className="space-y-2 p-4 rounded-md bg-muted/50 border">
                <label className="text-sm font-medium">
                  Instructions personnalisées pour l'IA
                </label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ex: Répondre de manière formelle en proposant un rendez-vous la semaine prochaine..."
                  rows={3}
                  data-testid="textarea-custom-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  L'IA utilisera ces instructions pour générer la réponse
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {selectedEmail?.suggestedResponse ? (
                <Button
                  onClick={() => setShowResponseDialog(true)}
                  data-testid="button-view-response"
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Voir / Modifier la réponse
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => generateResponseMutation.mutate({ 
                        emailId: selectedEmail?.id,
                        customPrompt: customPrompt || undefined
                      })}
                      disabled={generateResponseMutation.isPending}
                      data-testid="button-generate-response"
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {generateResponseMutation.isPending ? "Génération..." : "Générer une réponse"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPromptInput(!showPromptInput);
                        if (showPromptInput) {
                          setCustomPrompt("");
                        }
                      }}
                      data-testid="button-toggle-custom-prompt"
                      className="sm:w-auto"
                    >
                      <span className="truncate">
                        {showPromptInput ? "Masquer" : "Personnaliser"}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
              {selectedEmail?.status !== "traite" && (
                <Button
                  variant="outline"
                  onClick={() => markProcessedMutation.mutate(selectedEmail?.id)}
                  disabled={markProcessedMutation.isPending}
                  data-testid="button-mark-processed"
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {markProcessedMutation.isPending ? "En cours..." : "Marquer comme traité"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl w-[95vw] md:w-full">
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
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  markProcessedMutation.mutate(selectedEmail?.id);
                  setShowResponseDialog(false);
                }}
                disabled={markProcessedMutation.isPending}
                data-testid="button-mark-processed-dialog"
                className="w-full sm:w-auto"
              >
                <Check className="h-4 w-4 mr-2" />
                <span className="truncate">
                  {markProcessedMutation.isPending ? "En cours..." : "Marquer traité"}
                </span>
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowResponseDialog(false)}
                  className="flex-1 sm:flex-none"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() =>
                    sendResponseMutation.mutate({
                      emailId: selectedEmail?.id,
                      responseText: selectedEmail?.suggestedResponse || "",
                    })
                  }
                  disabled={sendResponseMutation.isPending || !selectedEmail?.suggestedResponse}
                  data-testid="button-approve-response"
                  className="flex-1 sm:flex-none"
                >
                  <span className="truncate">
                    {sendResponseMutation.isPending ? "Envoi..." : "Envoyer"}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
