import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tag as TagIcon, Plus, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = [
  { value: "#3b82f6", label: "Bleu" },
  { value: "#10b981", label: "Vert" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Rouge" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Rose" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#84cc16", label: "Lime" },
];

export default function Tags() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState({
    name: "",
    color: "#3b82f6",
    category: "general",
  });

  const { data: tags, isLoading } = useQuery({
    queryKey: ["/api/tags"],
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/tags", data);
    },
    onSuccess: () => {
      toast({ title: "Étiquette créée" });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setNewTag({ name: "", color: "#3b82f6", category: "general" });
      setOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'étiquette",
        variant: "destructive",
      });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/tags/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Étiquette supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    },
  });

  const categories = [
    { value: "devis", label: "Devis" },
    { value: "facture", label: "Facture" },
    { value: "rdv", label: "Rendez-vous" },
    { value: "client", label: "Client" },
    { value: "fournisseur", label: "Fournisseur" },
    { value: "general", label: "Général" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Étiquettes</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les étiquettes pour organiser vos emails et documents
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-tag">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle étiquette
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une étiquette</DialogTitle>
              <DialogDescription>
                Les étiquettes permettent de classer automatiquement vos emails et documents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Nom</Label>
                <Input
                  id="tag-name"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  placeholder="Ex: Client important"
                  data-testid="input-tag-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag-category">Catégorie</Label>
                <Select
                  value={newTag.category}
                  onValueChange={(value) => setNewTag({ ...newTag, category: value })}
                >
                  <SelectTrigger data-testid="select-tag-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="grid grid-cols-4 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewTag({ ...newTag, color: color.value })}
                      className={`h-10 rounded-md border-2 ${
                        newTag.color === color.value ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      data-testid={`color-${color.label}`}
                    >
                      <span className="sr-only">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => createTagMutation.mutate(newTag)}
                disabled={!newTag.name || createTagMutation.isPending}
                className="w-full"
                data-testid="button-create-tag"
              >
                Créer l'étiquette
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : tags && tags.length > 0 ? (
          tags.map((tag: any) => (
            <Card key={tag.id} className="hover-elevate" data-testid={`tag-${tag.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <CardTitle className="text-base">{tag.name}</CardTitle>
                  </div>
                  {!tag.isSystem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTagMutation.mutate(tag.id)}
                      className="h-8 w-8"
                      data-testid={`button-delete-tag-${tag.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-xs">
                  {categories.find((c) => c.value === tag.category)?.label || tag.category}
                </Badge>
                {tag.isSystem && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    Système
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <TagIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Aucune étiquette créée</p>
          </div>
        )}
      </div>
    </div>
  );
}
