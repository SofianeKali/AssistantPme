import { useState, useEffect, useRef } from "react";
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
import {
  Search,
  Mail,
  MailOpen,
  MoreVertical,
  Sparkles,
  Check,
  X,
  MailCheck,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  FileIcon,
  Trash2,
  Reply,
  CheckCircle,
  Inbox,
  Archive,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  Sliders,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatEmailDate } from "@/lib/dateUtils";
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
import { RichTextEditor } from "@/components/RichTextEditor";

// Helper function to convert HTML to safe single-line text (XSS protection)
function normalizeHtmlForPreview(
  html: string,
  maxLength: number = 150,
): string {
  if (!html) return "";

  // SECURITY: Strip ALL HTML tags to prevent XSS attacks
  // We use a temporary DOM element to safely extract text content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Get plain text content (automatically handles all HTML entities and strips tags)
  let normalized = tempDiv.textContent || tempDiv.innerText || "";

  // Collapse multiple spaces and trim
  normalized = normalized.replace(/\s+/g, " ").trim();

  // Truncate to maxLength
  if (normalized.length > maxLength) {
    normalized = normalized.substring(0, maxLength) + "...";
  }

  return normalized;
}

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
  const [alertId, setAlertId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20); // Number of emails per page
  const [showAISearchDialog, setShowAISearchDialog] = useState(false);
  const [aiSearchPrompt, setAISearchPrompt] = useState("");
  const [aiSearchActive, setAISearchActive] = useState(false);
  const [aiSearchCriteria, setAISearchCriteria] = useState<any>(null);
  const [deepSearch, setDeepSearch] = useState(false); // Deep search in attachments (off by default)
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isAiResponse, setIsAiResponse] = useState(false); // Track if response was AI-generated
  const customPromptRef = useRef<HTMLDivElement>(null);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load email categories dynamically
  const { data: emailCategories } = useQuery<any>({
    queryKey: ["/api/email-categories"],
  });

  // Load documents for selected email
  const { data: emailDocuments = [] } = useQuery<any[]>({
    queryKey: ["/api/emails", selectedEmail?.id, "documents"],
    enabled: !!selectedEmail?.id,
  });

  // Fetch sent replies for selected email
  const { data: emailReplies = [], isLoading: isLoadingReplies } = useQuery<
    any[]
  >({
    queryKey: ["/api/emails", selectedEmail?.id, "replies"],
    enabled: !!selectedEmail?.id,
  });

  // Read category, status, alertId, and emailId from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const status = params.get("status");
    const alert = params.get("alertId");
    const emailId = params.get("id");

    if (category) {
      setTypeFilter(category);
    }
    if (status) {
      setStatusFilter(status);
    }
    if (alert) {
      setAlertId(alert);
    } else {
      setAlertId(null);
    }

    // Auto-load and select email if id parameter is present
    if (emailId) {
      (async () => {
        try {
          const res = await fetch(`/api/emails/${emailId}`, { credentials: "include" });
          if (!res.ok) {
            throw new Error(`Failed to load email: ${res.status}`);
          }
          const email = await res.json();
          if (email) {
            setSelectedEmail(email);
          } else {
            throw new Error("No email data received");
          }
        } catch (error) {
          console.error("Error loading email:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger l'email",
            variant: "destructive",
          });
        }
      })();
    }
  }, [location, toast]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, search, alertId]);

  const { data: emailsData, isLoading } = useQuery({
    queryKey: alertId
      ? ["/api/alerts", alertId, "emails"]
      : aiSearchActive
        ? [
            "/api/emails/ai-search",
            aiSearchCriteria,
            deepSearch,
            page,
            pageSize,
          ]
        : [
            "/api/emails",
            { type: typeFilter, status: statusFilter, search, page, pageSize },
          ],
    queryFn: async () => {
      // If alertId is set, fetch emails for this alert
      if (alertId) {
        const res = await fetch(`/api/alerts/${alertId}/emails`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }

        // For alert emails, return in the same format as paginated emails
        const emails = await res.json();
        return {
          emails,
          total: emails.length,
          limit: emails.length,
          offset: 0,
        };
      }

      // If AI search is active, use already-analyzed criteria
      if (aiSearchActive && aiSearchCriteria) {
        const res = await fetch("/api/emails/ai-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            deepSearch,
            criteria: aiSearchCriteria,
            prompt: aiSearchPrompt,
            limit: pageSize,
            offset: (page - 1) * pageSize,
          }),
        });

        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }

        return res.json();
      }

      // Otherwise, fetch emails with filters and pagination
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (search) params.append("search", search);
      params.append("limit", pageSize.toString());
      params.append("offset", ((page - 1) * pageSize).toString());

      const url = `/api/emails${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return res.json();
    },
  });

  // Sort emails: unprocessed (nouveau) first, then by received date
  const emails = emailsData?.emails
    ? [...emailsData.emails].sort((a, b) => {
        // First, sort by status: "nouveau" comes first
        if (a.status === "nouveau" && b.status !== "nouveau") return -1;
        if (a.status !== "nouveau" && b.status === "nouveau") return 1;

        // Then sort by received date (most recent first)
        return (
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
      })
    : [];

  const totalPages = emailsData ? Math.ceil(emailsData.total / pageSize) : 0;

  // Clamp page to valid range when total changes
  useEffect(() => {
    if (emailsData && emailsData.total > 0) {
      const maxPage = Math.ceil(emailsData.total / pageSize);
      if (page > maxPage) {
        setPage(maxPage);
      }
    }
  }, [emailsData, page, pageSize]);

  // Handler for AI search
  const handleAISearch = async () => {
    if (!aiSearchPrompt.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un prompt de recherche",
        variant: "destructive",
      });
      return;
    }

    try {
      // Analyze the prompt with AI (only once)
      const res = await fetch("/api/emails/ai-search/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: aiSearchPrompt, deepSearch }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze search prompt");
      }

      const { criteria } = await res.json();

      // Store the extracted criteria
      setAISearchCriteria(criteria);
      setAISearchActive(true);
      setShowAISearchDialog(false);
      setPage(1);
      // Clear normal filters when AI search is active
      setTypeFilter("all");
      setStatusFilter("all");
      setSearch("");

      toast({
        title: "Recherche IA activée",
        description: `${Object.keys(criteria).length} critères extraits de votre recherche`,
      });
    } catch (error) {
      console.error("Error analyzing search prompt:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible d'analyser votre recherche. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  // Handler to clear AI search
  const clearAISearch = () => {
    setAISearchActive(false);
    setAISearchPrompt("");
    setAISearchCriteria(null);
    setDeepSearch(false);
    setPage(1);
  };

  const generateResponseMutation = useMutation({
    mutationFn: async ({
      emailId,
      customPrompt,
    }: {
      emailId: string;
      customPrompt?: string;
    }) => {
      // Only send customPrompt if it has actual content (not empty string)
      const promptToSend =
        customPrompt && customPrompt.trim().length > 0
          ? customPrompt.trim()
          : undefined;

      const res = await apiRequest(
        "POST",
        `/api/emails/${emailId}/generate-response`,
        {
          ...(promptToSend && { customPrompt: promptToSend }),
        },
      );
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Update selected email with the generated response
      setSelectedEmail({ ...selectedEmail, suggestedResponse: data.response });
      setIsAiResponse(true); // Mark as AI-generated response
      setShowResponseDialog(true);
      // Clear custom prompt and hide input after successful generation
      setCustomPrompt("");
      setShowPromptInput(false);
      // Invalidate queries to refresh email list with updated suggestedResponse
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });

      // Determine if custom prompt was actually used
      const usedCustomPrompt =
        variables.customPrompt && variables.customPrompt.trim().length > 0;

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
      const res = await apiRequest(
        "PATCH",
        `/api/emails/${emailId}/mark-processed`,
        {},
      );
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/emails/stats/by-category"],
      });
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

  const markReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const res = await apiRequest(
        "PATCH",
        `/api/emails/${emailId}/mark-read`,
        {},
      );
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
  });

  const sendResponseMutation = useMutation({
    mutationFn: async ({
      emailId,
      responseText,
      attachments,
    }: {
      emailId: string;
      responseText: string;
      attachments?: File[];
    }) => {
      // Use FormData for multipart upload
      const formData = new FormData();
      formData.append("responseText", responseText);

      // Add attachments if any
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      const res = await fetch(`/api/emails/${emailId}/send-response`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: res.statusText }));
        throw new Error(errorData.error || errorData.message || res.statusText);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Réponse envoyée",
        description: "Votre réponse a été envoyée avec succès",
      });
      setShowResponseDialog(false);
      setSelectedEmail(null);
      setAttachments([]); // Clear attachments
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer la réponse",
        variant: "destructive",
      });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async ({
      emailIds,
      status,
    }: {
      emailIds: string[];
      status: string;
    }) => {
      const res = await apiRequest("PATCH", "/api/emails/bulk/update-status", {
        emailIds,
        status,
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/emails/stats/by-category"],
      });
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
        description:
          error.message || "Impossible de mettre à jour le statut des emails",
        variant: "destructive",
      });
    },
  });

  const bulkMarkProcessedMutation = useMutation({
    mutationFn: async (emailIds: string[]) => {
      const res = await apiRequest("PATCH", "/api/emails/bulk/mark-processed", {
        emailIds,
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh email list
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/emails/stats/by-category"],
      });
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
        description:
          error.message || "Impossible de marquer les emails comme traités",
        variant: "destructive",
      });
    },
  });

  // Helper to get category by key (emailType)
  const getCategoryByKey = (key: string) => {
    if (!emailCategories || !Array.isArray(emailCategories)) return null;
    return emailCategories.find((cat: any) => cat.key === key);
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
      setSelectedEmailIds(selectedEmailIds.filter((id) => id !== emailId));
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

  // Format email address by extracting only the display name (no email, no brackets)
  const formatEmailAddress = (emailAddress: string) => {
    if (!emailAddress) return "";
    // Extract name before < or return whole string if no <
    const match = emailAddress.match(/^"?([^"<]+)"?\s*</);
    if (match) {
      return match[1].trim();
    }
    // If no < found, check if it's just an email address
    if (emailAddress.includes("@")) {
      // Return the part before @ as fallback
      return emailAddress.split("@")[0].trim();
    }
    return emailAddress.trim();
  };

  // Get initials from email address (after formatting)
  const getEmailInitial = (emailAddress: string) => {
    if (!emailAddress) return "?";
    const formatted = formatEmailAddress(emailAddress);
    // Try to get first letter of name before <email>
    const match = formatted.match(/^([A-Za-z])/);
    return match ? match[1].toUpperCase() : "?";
  };

  // Calculate email stats for cards
  const emailStats = {
    nouveau: emails?.filter((e: any) => e.status === "nouveau").length || 0,
    en_cours: emails?.filter((e: any) => e.status === "en_cours").length || 0,
    traite: emails?.filter((e: any) => e.status === "traite").length || 0,
    archive: emails?.filter((e: any) => e.status === "archive").length || 0,
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gestion des Emails
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mt-1">
            Gestion centralisée, analyse intelligente et traitement automatisé de vos emails
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Nouveau Card */}
        <Card className="p-4 border-l-4 border-l-chart-2 hover-elevate cursor-pointer transition-all" onClick={() => setStatusFilter("nouveau")} data-testid="card-status-nouveau">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">Nouveau</p>
              <p className="text-2xl md:text-3xl font-bold text-chart-2">{emailStats.nouveau}</p>
            </div>
            <Mail className="h-5 w-5 text-chart-2 flex-shrink-0 opacity-60" />
          </div>
        </Card>

        {/* En cours Card */}
        <Card className="p-4 border-l-4 border-l-chart-3 hover-elevate cursor-pointer transition-all" onClick={() => setStatusFilter("en_cours")} data-testid="card-status-en-cours">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">En cours</p>
              <p className="text-2xl md:text-3xl font-bold text-chart-3">{emailStats.en_cours}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-chart-3 flex-shrink-0 opacity-60" />
          </div>
        </Card>

        {/* Traité Card */}
        <Card className="p-4 border-l-4 border-l-emerald-500 hover-elevate cursor-pointer transition-all" onClick={() => setStatusFilter("traite")} data-testid="card-status-traite">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">Traité</p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{emailStats.traite}</p>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 opacity-60" />
          </div>
        </Card>

        {/* Archivé Card */}
        <Card className="p-4 border-l-4 border-l-muted hover-elevate cursor-pointer transition-all" onClick={() => setStatusFilter("archive")} data-testid="card-status-archive">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-medium mb-1">Archivé</p>
              <p className="text-2xl md:text-3xl font-bold text-muted-foreground">{emailStats.archive}</p>
            </div>
            <Archive className="h-5 w-5 text-muted-foreground flex-shrink-0 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Alert Banner */}
      {alertId && (
        <Card className="p-4 bg-destructive/5 border-destructive/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Affichage des emails liés à une alerte spécifique
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newUrl = window.location.pathname;
                window.history.pushState({}, "", newUrl);
                setAlertId(null);
              }}
              data-testid="button-clear-alert-filter"
            >
              Voir tous
            </Button>
          </div>
        </Card>
      )}

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
            disabled={!!alertId || aiSearchActive}
          />
        </div>
        <Button
          variant={aiSearchActive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAISearchDialog(true)}
          disabled={!!alertId}
          data-testid="button-ai-search"
          className="flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {aiSearchActive ? "Recherche IA active" : "Recherche IA"}
        </Button>
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
          disabled={!!alertId}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            data-testid="select-email-type"
          >
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
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          disabled={!!alertId}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            data-testid="select-email-status"
          >
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

      {/* AI Search Criteria Display */}
      {aiSearchActive && aiSearchCriteria && (
        <Card className="p-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Recherche IA: "{aiSearchPrompt}"
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAISearch}
                data-testid="button-clear-ai-search"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {aiSearchCriteria.from && (
                <Badge variant="secondary" data-testid="criteria-from">
                  De: {aiSearchCriteria.from}
                </Badge>
              )}
              {aiSearchCriteria.subject && (
                <Badge variant="secondary" data-testid="criteria-subject">
                  Sujet: {aiSearchCriteria.subject}
                </Badge>
              )}
              {aiSearchCriteria.categories &&
                aiSearchCriteria.categories.length > 0 && (
                  <Badge variant="secondary" data-testid="criteria-categories">
                    Catégories: {aiSearchCriteria.categories.join(", ")}
                  </Badge>
                )}
              {aiSearchCriteria.priority && (
                <Badge variant="secondary" data-testid="criteria-priority">
                  Priorité: {aiSearchCriteria.priority}
                </Badge>
              )}
              {aiSearchCriteria.status && (
                <Badge variant="secondary" data-testid="criteria-status">
                  Statut: {aiSearchCriteria.status}
                </Badge>
              )}
              {aiSearchCriteria.dateFrom && (
                <Badge variant="secondary" data-testid="criteria-date-from">
                  Depuis:{" "}
                  {new Date(aiSearchCriteria.dateFrom).toLocaleDateString(
                    "fr-FR",
                  )}
                </Badge>
              )}
              {aiSearchCriteria.dateTo && (
                <Badge variant="secondary" data-testid="criteria-date-to">
                  Jusqu'au:{" "}
                  {new Date(aiSearchCriteria.dateTo).toLocaleDateString(
                    "fr-FR",
                  )}
                </Badge>
              )}
              {aiSearchCriteria.isRead !== undefined && (
                <Badge variant="secondary" data-testid="criteria-is-read">
                  {aiSearchCriteria.isRead ? "Lus" : "Non lus"}
                </Badge>
              )}
              {aiSearchCriteria.hasAttachments && (
                <Badge variant="secondary" data-testid="criteria-attachments">
                  Avec pièces jointes
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}

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
                <span className="text-xs md:text-sm text-muted-foreground">
                  Mise à jour...
                </span>
              ) : (
                <span className="text-xs md:text-sm text-muted-foreground w-full md:w-auto">
                  Changer le statut :
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateStatus("nouveau")}
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
                onClick={() => handleBulkUpdateStatus("en_cours")}
                disabled={bulkUpdateStatusMutation.isPending}
                data-testid="button-bulk-mark-en-cours"
                className="flex-1 md:flex-none"
              >
                <span className="text-xs sm:text-sm">En cours</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleBulkUpdateStatus("traite")}
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
                onClick={() => handleBulkUpdateStatus("archive")}
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

      {/* Email Detail View or Email List */}
      {selectedEmail ? (
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Modern Sticky Header with Actions */}
          <div className="sticky top-0 -mx-4 md:-mx-6 px-4 md:px-6 py-3 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50 shadow-sm flex-shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* Left: Back Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedEmail(null);
                  setShowResponseDialog(false);
                }}
                className="flex items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Retour aux emails</span>
              </Button>

              {/* Right: Quick Action Group */}
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                {/* Reply Button - Primary Action */}
                <Button
                  size="icon"
                  onClick={() => {
                    if (!selectedEmail?.suggestedResponse) {
                      setSelectedEmail({
                        ...selectedEmail,
                        suggestedResponse: "",
                      });
                      setIsAiResponse(false);
                    }
                    setShowResponseDialog(true);
                  }}
                  variant={
                    selectedEmail?.suggestedResponse ? "outline" : "default"
                  }
                  data-testid="button-manual-reply-quick"
                  title={
                    selectedEmail?.suggestedResponse
                      ? "Modifier la réponse"
                      : "Répondre"
                  }
                  className="hover-elevate active-elevate-2"
                >
                  <Reply className="h-4 w-4" />
                </Button>

                {/* Divider */}
                <div className="h-6 w-px bg-border/50 mx-1" />

                {/* Generate AI Response Button */}
                {!selectedEmail?.suggestedResponse && (
                  <Button
                    size="icon"
                    onClick={() =>
                      generateResponseMutation.mutate({
                        emailId: selectedEmail?.id,
                        customPrompt: customPrompt || undefined,
                      })
                    }
                    disabled={generateResponseMutation.isPending}
                    data-testid="button-generate-response-quick"
                    variant="outline"
                    title="Générer une réponse avec l'IA"
                    className="hover-elevate active-elevate-2"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                )}

                {/* Customize Button */}
                {!selectedEmail?.suggestedResponse && (
                  <Button
                    size="icon"
                    onClick={() => {
                      setShowPromptInput(!showPromptInput);
                      if (showPromptInput) {
                        setCustomPrompt("");
                      }
                    }}
                    data-testid="button-toggle-custom-prompt-quick"
                    variant={showPromptInput ? "default" : "outline"}
                    title={showPromptInput ? "Masquer les instructions" : "Personnaliser avec instructions"}
                    className="hover-elevate active-elevate-2"
                  >
                    <Sliders className="h-4 w-4" />
                  </Button>
                )}

                {/* Mark as Processed Button */}
                {selectedEmail?.status !== "traite" && (
                  <Button
                    size="icon"
                    onClick={() =>
                      markProcessedMutation.mutate(selectedEmail?.id)
                    }
                    disabled={markProcessedMutation.isPending}
                    data-testid="button-mark-processed-quick"
                    variant="outline"
                    title="Marquer comme traité"
                    className="hover-elevate active-elevate-2 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Email Content Area */}
          <div className="flex-1 overflow-y-auto" ref={scrollableAreaRef}>
            {/* Email Detail Card */}
            <Card className="p-6 md:p-8">
              <div className="space-y-6">
              {/* Header */}
              <div className="space-y-3 border-b pb-4">
                <h1 className="text-2xl md:text-3xl font-bold break-words">
                  {selectedEmail?.subject}
                </h1>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium text-foreground">De:</span>
                    <span className="break-all">
                      {formatEmailAddress(selectedEmail?.from || "")}
                    </span>
                  </div>
                  {selectedEmail?.to && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-foreground">À:</span>
                      <span className="break-all">
                        {formatEmailAddress(selectedEmail?.to)}
                      </span>
                    </div>
                  )}
                  {selectedEmail?.receivedAt && (
                    <div>
                      {format(
                        new Date(selectedEmail.receivedAt),
                        "dd MMMM yyyy à HH:mm",
                        { locale: fr },
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis */}
              {selectedEmail?.aiAnalysis && (
                <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Analyse IA</span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">
                    {selectedEmail.aiAnalysis.summary || "Analyse en cours..."}
                  </p>
                </div>
              )}

              {/* Sent Replies History */}
              {isLoadingReplies ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                emailReplies.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MailCheck className="h-4 w-4" />
                      <span>Réponses envoyées ({emailReplies.length})</span>
                    </div>
                    <div className="space-y-3">
                      {emailReplies.map((reply: any) => (
                        <div
                          key={reply.id}
                          className="p-4 rounded-md bg-muted/50 border"
                          data-testid={`reply-${reply.id}`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {reply.sentByUserId?.charAt(0)?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">
                                  Envoyée le{" "}
                                  {format(
                                    new Date(reply.sentAt),
                                    "dd MMM yyyy à HH:mm",
                                    { locale: fr },
                                  )}
                                </span>
                                {reply.aiGenerated && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    IA
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div
                            className="prose prose-sm max-w-none text-sm"
                            dangerouslySetInnerHTML={{
                              __html: reply.htmlContent,
                            }}
                          />
                          {reply.attachments && reply.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex flex-wrap gap-2">
                                {reply.attachments.map(
                                  (att: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 px-2 py-1 rounded bg-background/50 text-xs"
                                      data-testid={`reply-attachment-${idx}`}
                                    >
                                      <Paperclip className="h-3 w-3" />
                                      <span className="truncate max-w-[200px]">
                                        {att.name}
                                      </span>
                                      <span className="text-muted-foreground">
                                        ({(att.size / 1024).toFixed(1)} KB)
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Suggested Response */}
              {selectedEmail?.suggestedResponse && isAiResponse && (
                <div className="p-4 rounded-md bg-chart-2/5 border border-chart-2/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-chart-2" />
                    <span className="text-sm font-medium">
                      Réponse suggérée par IA
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{
                      __html: selectedEmail.suggestedResponse,
                    }}
                  />
                </div>
              )}

              {/* Email Body */}
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-sm break-words overflow-wrap-anywhere"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedEmail?.htmlBody ||
                      selectedEmail?.body?.replace(/\n/g, "<br>") ||
                      "",
                  }}
                />
              </div>

              {/* Attachments */}
              {emailDocuments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Paperclip className="h-4 w-4" />
                    <span>Pièces jointes ({emailDocuments.length})</span>
                  </div>
                  <div className="grid gap-2">
                    {emailDocuments.map((doc: any) => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          if (doc.driveUrl || doc.storagePath) {
                            if (doc.driveUrl) {
                              window.open(doc.driveUrl, "_blank");
                            } else {
                              toast({
                                title: "Fichier non disponible",
                                description:
                                  "Le fichier n'est pas encore stocké dans le cloud",
                                variant: "destructive",
                              });
                            }
                          } else {
                            toast({
                              title: "Fichier non disponible",
                              description:
                                "Le fichier n'est pas encore stocké dans le cloud",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="flex items-center gap-3 p-3 rounded-md border hover-elevate active-elevate-2 text-left transition-colors"
                        data-testid={`attachment-${doc.id}`}
                      >
                        <FileIcon className="h-8 w-8 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {doc.filename}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                            {doc.storageProvider && (
                              <>
                                <span>•</span>
                                <span>
                                  {doc.storageProvider === "google_drive"
                                    ? "Google Drive"
                                    : doc.storageProvider === "onedrive"
                                      ? "OneDrive"
                                      : "Local"}
                                </span>
                              </>
                            )}
                            {doc.driveUrl && (
                              <>
                                <span>•</span>
                                <span className="text-primary">
                                  Cliquez pour ouvrir
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Prompt Input */}
              {!selectedEmail?.suggestedResponse && showPromptInput && (
                <div ref={customPromptRef} className="space-y-2 p-4 rounded-md bg-muted/50 border">
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
            </div>
          </Card>
            </div>

          {/* Fixed Bottom Action Footer */}
          <div className="flex-shrink-0 -mx-4 md:-mx-6 px-4 md:px-6 py-3 border-t border-border/50 bg-background/80 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 flex-wrap">
              {/* Reply Button - Primary Action */}
              <Button
                size="icon"
                onClick={() => {
                  if (!selectedEmail?.suggestedResponse) {
                    setSelectedEmail({
                      ...selectedEmail,
                      suggestedResponse: "",
                    });
                    setIsAiResponse(false);
                  }
                  setShowResponseDialog(true);
                }}
                variant={
                  selectedEmail?.suggestedResponse ? "outline" : "default"
                }
                data-testid="button-manual-reply-bottom"
                title={
                  selectedEmail?.suggestedResponse
                    ? "Modifier la réponse"
                    : "Répondre"
                }
                className="hover-elevate active-elevate-2"
              >
                <Reply className="h-4 w-4" />
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-border/50 mx-1" />

              {/* Generate AI Response Button */}
              {!selectedEmail?.suggestedResponse && (
                <Button
                  size="icon"
                  onClick={() =>
                    generateResponseMutation.mutate({
                      emailId: selectedEmail?.id,
                      customPrompt: customPrompt || undefined,
                    })
                  }
                  disabled={generateResponseMutation.isPending}
                  data-testid="button-generate-response-bottom"
                  variant="outline"
                  title="Générer une réponse avec l'IA"
                  className="hover-elevate active-elevate-2"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}

              {/* Customize Button */}
              {!selectedEmail?.suggestedResponse && (
                <Button
                  size="icon"
                  onClick={() => {
                    const isCurrentlyOpen = showPromptInput;
                    setShowPromptInput(!isCurrentlyOpen);
                    if (isCurrentlyOpen) {
                      setCustomPrompt("");
                    } else {
                      // Scroll to custom prompt when opening
                      setTimeout(() => {
                        if (customPromptRef.current) {
                          customPromptRef.current.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }, 100);
                    }
                  }}
                  data-testid="button-toggle-custom-prompt-bottom"
                  variant={showPromptInput ? "default" : "outline"}
                  title={showPromptInput ? "Masquer les instructions" : "Personnaliser avec instructions"}
                  className="hover-elevate active-elevate-2"
                >
                  <Sliders className="h-4 w-4" />
                </Button>
              )}

              {/* Mark as Processed Button */}
              {selectedEmail?.status !== "traite" && (
                <Button
                  size="icon"
                  onClick={() =>
                    markProcessedMutation.mutate(selectedEmail?.id)
                  }
                  disabled={markProcessedMutation.isPending}
                  data-testid="button-mark-processed-bottom"
                  variant="outline"
                  title="Marquer comme traité"
                  className="hover-elevate active-elevate-2 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Email List */}
          <Card className="divide-y divide-border">
            {/* Select All Header */}
            {emails && emails.length > 0 && (
              <div className="p-4 bg-muted/30">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={
                      emails.length > 0 && selectedEmailIds.length === emails.length
                    }
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
                email.status === "nouveau"
                  ? "border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10"
                  : ""
              }`}
              data-testid={`email-${email.id}`}
            >
              <div className="flex items-start gap-2 md:gap-4">
                <Checkbox
                  checked={selectedEmailIds.includes(email.id)}
                  onCheckedChange={(checked) =>
                    handleSelectEmail(email.id, checked as boolean)
                  }
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`checkbox-email-${email.id}`}
                  className="mt-2 md:mt-3 flex-shrink-0"
                />
                <div
                  className="flex items-start gap-2 md:gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    setSelectedEmail(email);
                    // If email has suggestedResponse from DB, it's AI-generated
                    setIsAiResponse(!!email.suggestedResponse);
                    if (!email.isRead) {
                      markReadMutation.mutate(email.id);
                    }
                  }}
                >
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getEmailInitial(email.from)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        {/* Sender - Subject : Body Preview */}
                        <div className="flex items-start gap-2 mb-1">
                          <div className="flex items-baseline gap-2 overflow-hidden flex-1 min-w-0">
                            {/* Sender - Fixed width */}
                            <div
                              className="flex-shrink-0 overflow-hidden"
                              style={{ flexBasis: "12rem" }}
                            >
                              <span
                                className={`${
                                  email.status === "nouveau"
                                    ? "font-medium"
                                    : "text-muted-foreground"
                                } text-sm truncate block`}
                                title={formatEmailAddress(email.from)}
                              >
                                {formatEmailAddress(email.from)}
                              </span>
                            </div>

                            {/* Subject - Fixed width */}
                            <div className="flex-shrink-0 overflow-hidden">
                              <span
                                className={`${
                                  email.status === "nouveau"
                                    ? "font-semibold"
                                    : "text-muted-foreground"
                                } text-sm truncate block`}
                                title={email.subject}
                              >
                                {email.subject}
                              </span>
                            </div>

                            <span className="text-sm text-muted-foreground flex-shrink-0">
                              -
                            </span>

                            {/* Preview - Takes remaining space (plain text for security) */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <span
                                className="text-sm text-muted-foreground truncate whitespace-nowrap block"
                                title={normalizeHtmlForPreview(
                                  email.htmlBody || email.body || "",
                                  500,
                                )}
                              >
                                {normalizeHtmlForPreview(
                                  email.htmlBody || email.body || "",
                                  150,
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                            {email.respondedAt && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex-shrink-0"
                                data-testid={`badge-responded-${email.id}`}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">
                                  Répondu
                                </span>
                              </Badge>
                            )}
                            {email.isRead ? (
                              <MailOpen
                                className="h-4 w-4 text-muted-foreground flex-shrink-0"
                                data-testid={`icon-read-${email.id}`}
                              />
                            ) : (
                              <Mail
                                className="h-4 w-4 text-primary flex-shrink-0"
                                data-testid={`icon-unread-${email.id}`}
                              />
                            )}
                            {email.attachmentCount > 0 && (
                              <span
                                className="flex-shrink-0"
                                title={`${email.attachmentCount} pièce(s) jointe(s)`}
                              >
                                <Paperclip
                                  className="h-4 w-4 text-muted-foreground"
                                  data-testid={`icon-attachment-${email.id}`}
                                />
                              </span>
                            )}
                            {email.status && (
                              <Badge
                                variant="outline"
                                className={`text-xs flex-shrink-0 ${getStatusColor(email.status)}`}
                                data-testid={`badge-status-${email.id}`}
                              >
                                {getStatusLabel(email.status)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Recipient + Category/Priority badges */}
                        {email.to && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-xs text-muted-foreground">
                              À:{" "}
                              <span className="truncate max-w-[200px] md:max-w-none inline-block align-bottom">
                                {formatEmailAddress(email.to)}
                              </span>
                            </div>
                            {email.emailType &&
                              (() => {
                                const category = getCategoryByKey(
                                  email.emailType,
                                );
                                const categoryColor =
                                  category?.color || "#6366f1";
                                return (
                                  <Badge
                                    variant="outline"
                                    className="text-xs flex-shrink-0 border"
                                    style={{
                                      backgroundColor: `${categoryColor}15`,
                                      color: categoryColor,
                                      borderColor: `${categoryColor}40`,
                                    }}
                                  >
                                    {category?.label || email.emailType}
                                  </Badge>
                                );
                              })()}
                            {email.priority && email.priority !== "normal" && (
                              <Badge
                                variant="outline"
                                className={`text-xs flex-shrink-0 ${getPriorityColor(email.priority)}`}
                              >
                                {email.priority}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatEmailDate(email.receivedAt)}
                        </span>
                        {email.status !== "traite" && (
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
                            <CheckCircle className="h-4 w-4 mr-2" />
                          </Button>
                        )}
                      </div>
                    </div>
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
        </>
      )}

      {/* Pagination Controls */}
      {!selectedEmail && !alertId && emailsData && (totalPages > 1 || page > 1) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 py-4">
          <div className="text-sm text-muted-foreground">
            {emailsData.total > 0 ? (
              <>
                Affichage de {(page - 1) * pageSize + 1} à{" "}
                {Math.min(page * pageSize, emailsData.total)} sur{" "}
                {emailsData.total} emails
              </>
            ) : (
              <>Aucun email trouvé</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <div className="text-sm text-muted-foreground px-2">
              Page {page} sur {Math.max(1, totalPages)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              data-testid="button-next-page"
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* AI Search Dialog */}
      <Dialog open={showAISearchDialog} onOpenChange={setShowAISearchDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recherche Intelligente par IA
            </DialogTitle>
            <DialogDescription>
              Décrivez ce que vous recherchez en langage naturel. Par exemple:
              "emails non lus de Marie reçus cette semaine" ou "factures
              urgentes non payées"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Que recherchez-vous ?
              </label>
              <Textarea
                value={aiSearchPrompt}
                onChange={(e) => setAISearchPrompt(e.target.value.slice(0, 75))}
                placeholder="Ex: emails avec pièces jointes de Jean reçus hier"
                rows={3}
                maxLength={75}
                data-testid="textarea-ai-search-prompt"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    handleAISearch();
                  }
                }}
              />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {aiSearchPrompt.length} / 75 caractères
              </div>
            </div>
            <div className="flex items-start space-x-2 p-3 rounded-md bg-muted/50 border">
              <Checkbox
                id="deep-search"
                checked={deepSearch}
                onCheckedChange={(checked) => setDeepSearch(checked === true)}
                data-testid="checkbox-deep-search"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="deep-search"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Recherche approfondie
                </label>
                <p className="text-sm text-muted-foreground">
                  Active la recherche dans le contenu des pièces jointes
                  (documents PDF, images OCR). Peut augmenter le temps de
                  recherche.
                </p>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-md text-sm space-y-2">
              <p className="font-medium">Exemples de recherches :</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>emails non lus de Marie</li>
                <li>factures urgentes cette semaine</li>
                <li>emails avec pièces jointes de Jean</li>
                <li>devis non traités du mois dernier</li>
                <li>emails nécessitant une réponse</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAISearchDialog(false);
                  setAISearchPrompt("");
                }}
                data-testid="button-cancel-ai-search"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAISearch}
                disabled={!aiSearchPrompt.trim()}
                data-testid="button-submit-ai-search"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl w-full md:w-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmail?.suggestedResponse &&
              selectedEmail?.suggestedResponse.trim() !== ""
                ? "Réponse générée par IA"
                : "Rédiger une réponse"}
            </DialogTitle>
            <DialogDescription>
              {selectedEmail?.suggestedResponse &&
              selectedEmail?.suggestedResponse.trim() !== ""
                ? "Vous pouvez modifier la réponse avant de l'envoyer"
                : "Rédigez votre réponse à cet email"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RichTextEditor
              content={selectedEmail?.suggestedResponse || ""}
              onChange={(html) =>
                setSelectedEmail({
                  ...selectedEmail,
                  suggestedResponse: html,
                })
              }
              placeholder="Rédigez votre réponse ici..."
              className="min-h-[300px]"
            />

            {/* Attachments Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Pièces jointes
              </label>

              {/* File Input */}
              <div>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const maxFileSize = 15 * 1024 * 1024; // 15 MB per file
                    const maxTotalSize = 25 * 1024 * 1024; // 25 MB total

                    // Check individual file sizes
                    const oversizedFile = files.find(
                      (f) => f.size > maxFileSize,
                    );
                    if (oversizedFile) {
                      toast({
                        title: "Fichier trop volumineux",
                        description: `Le fichier "${oversizedFile.name}" dépasse la taille maximale de 15 MB par fichier`,
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }

                    // Check total size
                    const totalSize = [...attachments, ...files].reduce(
                      (sum, f) => sum + f.size,
                      0,
                    );
                    if (totalSize > maxTotalSize) {
                      toast({
                        title: "Taille totale dépassée",
                        description:
                          "La taille totale des pièces jointes ne peut pas dépasser 25 MB",
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }

                    setAttachments([...attachments, ...files]);
                    // Reset input
                    e.target.value = "";
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.7z,.json,.xml"
                  data-testid="input-attachments"
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Max 15 MB par fichier, 25 MB au total. Types acceptés : PDF,
                  Word, Excel, PowerPoint, Images, Archives, etc.
                </p>
              </div>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm"
                      data-testid={`attachment-${index}`}
                    >
                      <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => {
                          setAttachments(
                            attachments.filter((_, i) => i !== index),
                          );
                        }}
                        data-testid={`button-remove-attachment-${index}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Taille totale :{" "}
                    {(
                      attachments.reduce((sum, f) => sum + f.size, 0) /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB / 25 MB
                  </p>
                </div>
              )}
            </div>

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
                  {markProcessedMutation.isPending
                    ? "En cours..."
                    : "Marquer traité"}
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
                      attachments,
                    })
                  }
                  disabled={
                    sendResponseMutation.isPending ||
                    !selectedEmail?.suggestedResponse
                  }
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
