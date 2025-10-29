import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Mail,
  Save,
  Trash2,
  RefreshCw,
  Info,
  Plus,
  Tag,
  AlertCircle,
  Bell,
  Settings as SettingsIcon,
  Pencil,
  FileText,
  Calendar,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Folder,
  File,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Heart,
  Home,
  Phone,
  MapPin,
  Send,
  Inbox,
  Archive,
  PieChart,
  BarChart,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Zap,
  Gift,
  Truck,
  Receipt,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Liste d'icônes Lucide disponibles pour les catégories
const AVAILABLE_ICONS = [
  { name: "Mail", component: Mail },
  { name: "FileText", component: FileText },
  { name: "Calendar", component: Calendar },
  { name: "DollarSign", component: DollarSign },
  { name: "Package", component: Package },
  { name: "ShoppingCart", component: ShoppingCart },
  { name: "Users", component: Users },
  { name: "Folder", component: Folder },
  { name: "File", component: File },
  { name: "Briefcase", component: Briefcase },
  { name: "Clock", component: Clock },
  { name: "CheckCircle", component: CheckCircle },
  { name: "XCircle", component: XCircle },
  { name: "AlertTriangle", component: AlertTriangle },
  { name: "Star", component: Star },
  { name: "Heart", component: Heart },
  { name: "Home", component: Home },
  { name: "Phone", component: Phone },
  { name: "MapPin", component: MapPin },
  { name: "Send", component: Send },
  { name: "Inbox", component: Inbox },
  { name: "Archive", component: Archive },
  { name: "Tag", component: Tag },
  { name: "PieChart", component: PieChart },
  { name: "BarChart", component: BarChart },
  { name: "TrendingUp", component: TrendingUp },
  { name: "ShoppingBag", component: ShoppingBag },
  { name: "CreditCard", component: CreditCard },
  { name: "Zap", component: Zap },
  { name: "Gift", component: Gift },
  { name: "Truck", component: Truck },
  { name: "Receipt", component: Receipt },
  { name: "Bell", component: Bell },
  { name: "AlertCircle", component: AlertCircle },
];

// Couleurs prédéfinies
const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#a855f7", // purple
];

// Cloud Storage Configuration Component
function CloudStorageConfigForm() {
  const { toast } = useToast();
  const [editingConfig, setEditingConfig] = useState<any | null>(null);
  const [newConfig, setNewConfig] = useState({
    provider: "",
    credentials: {
      clientId: "",
      clientSecret: "",
      refreshToken: "",
      tenantId: "", // For OneDrive
    },
  });

  const { data: cloudConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ["/api/cloud-storage-configs"],
  });

  const createConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/cloud-storage-configs", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Configuration cloud ajoutée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-storage-configs"] });
      setNewConfig({
        provider: "",
        credentials: {
          clientId: "",
          clientSecret: "",
          refreshToken: "",
          tenantId: "",
        },
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter la configuration",
        variant: "destructive",
      });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/cloud-storage-configs/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Configuration cloud mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-storage-configs"] });
      setEditingConfig(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la configuration",
        variant: "destructive",
      });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cloud-storage-configs/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Configuration cloud supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/cloud-storage-configs"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la configuration",
        variant: "destructive",
      });
    },
  });

  const handleCreateConfig = () => {
    if (!newConfig.provider) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fournisseur",
        variant: "destructive",
      });
      return;
    }

    createConfigMutation.mutate(newConfig);
  };

  const handleUpdateConfig = () => {
    if (editingConfig) {
      updateConfigMutation.mutate({
        id: editingConfig.id,
        data: {
          credentials: editingConfig.credentials,
        },
      });
    }
  };

  if (configsLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const googleConfig = (cloudConfigs as any[])?.find((c: any) => c.provider === "google_drive");
  const onedriveConfig = (cloudConfigs as any[])?.find((c: any) => c.provider === "onedrive");

  return (
    <div className="space-y-6">
      {/* Google Drive Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Google Drive</CardTitle>
          <CardDescription>
            Configurez vos identifiants OAuth pour Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleConfig ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Configuré</AlertTitle>
                <AlertDescription>
                  Votre compte Google Drive est connecté et actif.
                </AlertDescription>
              </Alert>
              {editingConfig?.provider === "google_drive" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-client-id">Client ID</Label>
                    <Input
                      id="google-client-id"
                      value={editingConfig.credentials.clientId || ""}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          credentials: {
                            ...editingConfig.credentials,
                            clientId: e.target.value,
                          },
                        })
                      }
                      data-testid="input-google-client-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-client-secret">Client Secret</Label>
                    <Input
                      id="google-client-secret"
                      type="password"
                      value={editingConfig.credentials.clientSecret || ""}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          credentials: {
                            ...editingConfig.credentials,
                            clientSecret: e.target.value,
                          },
                        })
                      }
                      data-testid="input-google-client-secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="google-refresh-token">Refresh Token</Label>
                    <Input
                      id="google-refresh-token"
                      type="password"
                      value={editingConfig.credentials.refreshToken || ""}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          credentials: {
                            ...editingConfig.credentials,
                            refreshToken: e.target.value,
                          },
                        })
                      }
                      data-testid="input-google-refresh-token"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateConfig}
                      disabled={updateConfigMutation.isPending}
                      data-testid="button-save-google-config"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingConfig(null)}
                      data-testid="button-cancel-google-edit"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingConfig(googleConfig)}
                    data-testid="button-edit-google-config"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteConfigMutation.mutate(googleConfig.id)}
                    disabled={deleteConfigMutation.isPending}
                    data-testid="button-delete-google-config"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {newConfig.provider === "google_drive" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-google-client-id">Client ID</Label>
                    <Input
                      id="new-google-client-id"
                      value={newConfig.credentials.clientId}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          credentials: {
                            ...newConfig.credentials,
                            clientId: e.target.value,
                          },
                        })
                      }
                      placeholder="Votre Client ID Google"
                      data-testid="input-new-google-client-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-google-client-secret">Client Secret</Label>
                    <Input
                      id="new-google-client-secret"
                      type="password"
                      value={newConfig.credentials.clientSecret}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          credentials: {
                            ...newConfig.credentials,
                            clientSecret: e.target.value,
                          },
                        })
                      }
                      placeholder="Votre Client Secret Google"
                      data-testid="input-new-google-client-secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-google-refresh-token">Refresh Token</Label>
                    <Input
                      id="new-google-refresh-token"
                      type="password"
                      value={newConfig.credentials.refreshToken}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          credentials: {
                            ...newConfig.credentials,
                            refreshToken: e.target.value,
                          },
                        })
                      }
                      placeholder="Votre Refresh Token Google"
                      data-testid="input-new-google-refresh-token"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateConfig}
                      disabled={createConfigMutation.isPending}
                      data-testid="button-create-google-config"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewConfig({
                          provider: "",
                          credentials: {
                            clientId: "",
                            clientSecret: "",
                            refreshToken: "",
                            tenantId: "",
                          },
                        })
                      }
                      data-testid="button-cancel-google-new"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() =>
                    setNewConfig({ ...newConfig, provider: "google_drive" })
                  }
                  data-testid="button-configure-google"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Configurer Google Drive
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* OneDrive Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">OneDrive</CardTitle>
          <CardDescription>
            Configurez vos identifiants OAuth pour OneDrive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onedriveConfig ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Configuré</AlertTitle>
                <AlertDescription>
                  Votre compte OneDrive est connecté et actif.
                </AlertDescription>
              </Alert>
              {editingConfig?.provider === "onedrive" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="onedrive-client-id">Client ID</Label>
                    <Input
                      id="onedrive-client-id"
                      value={editingConfig.credentials.clientId || ""}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          credentials: {
                            ...editingConfig.credentials,
                            clientId: e.target.value,
                          },
                        })
                      }
                      data-testid="input-onedrive-client-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onedrive-client-secret">Client Secret</Label>
                    <Input
                      id="onedrive-client-secret"
                      type="password"
                      value={editingConfig.credentials.clientSecret || ""}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          credentials: {
                            ...editingConfig.credentials,
                            clientSecret: e.target.value,
                          },
                        })
                      }
                      data-testid="input-onedrive-client-secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onedrive-refresh-token">Refresh Token</Label>
                    <Input
                      id="onedrive-refresh-token"
                      type="password"
                      value={editingConfig.credentials.refreshToken || ""}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          credentials: {
                            ...editingConfig.credentials,
                            refreshToken: e.target.value,
                          },
                        })
                      }
                      data-testid="input-onedrive-refresh-token"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onedrive-tenant-id">Tenant ID (optionnel)</Label>
                    <Input
                      id="onedrive-tenant-id"
                      value={editingConfig.credentials.tenantId || ""}
                      onChange={(e) =>
                        setEditingConfig({
                          ...editingConfig,
                          credentials: {
                            ...editingConfig.credentials,
                            tenantId: e.target.value,
                          },
                        })
                      }
                      placeholder="common (par défaut)"
                      data-testid="input-onedrive-tenant-id"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdateConfig}
                      disabled={updateConfigMutation.isPending}
                      data-testid="button-save-onedrive-config"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingConfig(null)}
                      data-testid="button-cancel-onedrive-edit"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingConfig(onedriveConfig)}
                    data-testid="button-edit-onedrive-config"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteConfigMutation.mutate(onedriveConfig.id)}
                    disabled={deleteConfigMutation.isPending}
                    data-testid="button-delete-onedrive-config"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {newConfig.provider === "onedrive" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-onedrive-client-id">Client ID</Label>
                    <Input
                      id="new-onedrive-client-id"
                      value={newConfig.credentials.clientId}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          credentials: {
                            ...newConfig.credentials,
                            clientId: e.target.value,
                          },
                        })
                      }
                      placeholder="Votre Client ID OneDrive"
                      data-testid="input-new-onedrive-client-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-onedrive-client-secret">Client Secret</Label>
                    <Input
                      id="new-onedrive-client-secret"
                      type="password"
                      value={newConfig.credentials.clientSecret}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          credentials: {
                            ...newConfig.credentials,
                            clientSecret: e.target.value,
                          },
                        })
                      }
                      placeholder="Votre Client Secret OneDrive"
                      data-testid="input-new-onedrive-client-secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-onedrive-refresh-token">Refresh Token</Label>
                    <Input
                      id="new-onedrive-refresh-token"
                      type="password"
                      value={newConfig.credentials.refreshToken}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          credentials: {
                            ...newConfig.credentials,
                            refreshToken: e.target.value,
                          },
                        })
                      }
                      placeholder="Votre Refresh Token OneDrive"
                      data-testid="input-new-onedrive-refresh-token"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-onedrive-tenant-id">Tenant ID (optionnel)</Label>
                    <Input
                      id="new-onedrive-tenant-id"
                      value={newConfig.credentials.tenantId}
                      onChange={(e) =>
                        setNewConfig({
                          ...newConfig,
                          credentials: {
                            ...newConfig.credentials,
                            tenantId: e.target.value,
                          },
                        })
                      }
                      placeholder="common (par défaut)"
                      data-testid="input-new-onedrive-tenant-id"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateConfig}
                      disabled={createConfigMutation.isPending}
                      data-testid="button-create-onedrive-config"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setNewConfig({
                          provider: "",
                          credentials: {
                            clientId: "",
                            clientSecret: "",
                            refreshToken: "",
                            tenantId: "",
                          },
                        })
                      }
                      data-testid="button-cancel-onedrive-new"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() =>
                    setNewConfig({ ...newConfig, provider: "onedrive" })
                  }
                  data-testid="button-configure-onedrive"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Configurer OneDrive
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: emailAccounts, isLoading: emailAccountsLoading } =
    useQuery<any>({
      queryKey: ["/api/email-accounts"],
    });

  const { data: settings, isLoading: settingsLoading } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const [activeTab, setActiveTab] = useState<string>("email");
  const [scanningAccountId, setScanningAccountId] = useState<string | null>(
    null,
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editingAccountSettings, setEditingAccountSettings] = useState<{
    id: string;
    scanFrequency: number;
    retentionDays: number;
  } | null>(null);

  // Fetch all system categories (categories not linked to specific accounts)
  const { data: emailCategories, isLoading: categoriesLoading } = useQuery<any>(
    {
      queryKey: ["/api/email-categories"],
    },
  );

  const [newAccount, setNewAccount] = useState({
    provider: "gmail",
    email: "",
    imapHost: "imap.gmail.com",
    imapPort: "993",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    username: "",
    password: "",
  });

  const [newCategory, setNewCategory] = useState({
    key: "",
    label: "",
    color: "#6366f1",
    icon: "Mail",
    isSystem: false,
    generateAutoResponse: true,
    autoCreateTask: false,
    autoMarkAsProcessed: false,
    redirectEmails: [] as string[],
  });

  const [alertPrompt, setAlertPrompt] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingRuleData, setEditingRuleData] = useState<any | null>(null);

  const { data: alertRules, isLoading: alertRulesLoading } = useQuery({
    queryKey: ["/api/alert-rules"],
  });

  const addAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/email-accounts", data);
      return await response.json();
    },
    onSuccess: async (account: any) => {
      // If categories were selected, assign them to the new account
      if (selectedCategoryIds.length > 0) {
        await apiRequest(
          "PUT",
          `/api/email-accounts/${account.id}/categories`,
          {
            categoryIds: selectedCategoryIds,
          },
        );
      }

      toast({ title: "Compte email ajouté avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-accounts"] });
      setNewAccount({
        provider: "gmail",
        email: "",
        imapHost: "imap.gmail.com",
        imapPort: "993",
        smtpHost: "smtp.gmail.com",
        smtpPort: "587",
        username: "",
        password: "",
      });
      setSelectedCategoryIds([]);
    },
    onError: (error: any) => {
      let errorMessage = "Impossible d'ajouter le compte email";

      // Provide helpful error messages based on error type
      if (
        error?.message?.includes("Invalid credentials") ||
        error?.message?.includes("AUTHENTICATIONFAILED")
      ) {
        if (newAccount.provider === "gmail") {
          errorMessage =
            "Authentification échouée. Pour Gmail, utilisez un App Password (voir le guide ci-dessus)";
        } else if (newAccount.provider === "yahoo") {
          errorMessage =
            "Authentification échouée. Pour Yahoo, utilisez un App Password (voir le guide ci-dessus)";
        } else {
          errorMessage =
            "Identifiants incorrects. Vérifiez votre nom d'utilisateur et mot de passe";
        }
      } else if (
        error?.message?.includes("ENOTFOUND") ||
        error?.message?.includes("ECONNREFUSED")
      ) {
        errorMessage =
          "Impossible de se connecter au serveur email. Vérifiez les paramètres IMAP/SMTP";
      }

      toast({
        title: "Erreur d'ajout du compte",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (data: { key: string; value: any }) => {
      return await apiRequest("PUT", `/api/settings/${data.key}`, {
        value: data.value,
      });
    },
    onSuccess: () => {
      toast({ title: "Paramètres mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/email-accounts/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Compte supprimé" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-accounts"] });
    },
  });

  const updateAccountSettingsMutation = useMutation({
    mutationFn: async (data: { id: string; scanFrequency: number; retentionDays: number }) => {
      return await apiRequest("PATCH", `/api/email-accounts/${data.id}`, {
        scanFrequency: data.scanFrequency,
        retentionDays: data.retentionDays,
      });
    },
    onSuccess: () => {
      toast({ title: "Paramètres du compte mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-accounts"] });
      setEditingAccountSettings(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres",
        variant: "destructive",
      });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create a global category (not a system category)
      const categoryData = {
        ...data,
        emailAccountId: null,
        isSystem: false, // User-created categories are not system categories
      };
      return await apiRequest("POST", "/api/email-categories", categoryData);
    },
    onSuccess: () => {
      toast({ title: "Catégorie ajoutée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-categories"] });
      setNewCategory({
        key: "",
        label: "",
        color: "#6366f1",
        icon: "Mail",
        isSystem: false,
        generateAutoResponse: true,
        autoCreateTask: false,
        autoMarkAsProcessed: false,
        redirectEmails: [],
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la catégorie",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/email-categories/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Catégorie modifiée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-categories"] });
      setEditingCategory(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la catégorie",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/email-categories/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Catégorie supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-categories"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie système",
        variant: "destructive",
      });
    },
  });

  const scanAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      setScanningAccountId(accountId);
      const response = await apiRequest(
        "POST",
        `/api/email-accounts/${accountId}/scan`,
        {},
      );
      return await response.json();
    },
    onSuccess: (data: any) => {
      setScanningAccountId(null);
      toast({
        title: "Scan terminé",
        description: `${data.created || 0} nouveau(x) email(s) importé(s)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/emails/stats/by-category"],
      });
    },
    onError: (error: any) => {
      setScanningAccountId(null);
      let errorMessage = "Impossible de scanner les emails";

      if (
        error?.message?.includes("Invalid credentials") ||
        error?.message?.includes("AUTHENTICATIONFAILED")
      ) {
        errorMessage =
          "Erreur d'authentification. Vérifiez vos App Passwords Gmail/Yahoo";
      } else if (error?.details) {
        errorMessage = error.details;
      }

      toast({
        title: "Erreur de scan",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const createAlertRuleMutation = useMutation({
    mutationFn: async (prompt: string) => {
      return await apiRequest("POST", "/api/alert-rules", { prompt });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Règle d'alerte créée",
        description: `"${data.name}" a été créée avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules"] });
      setAlertPrompt("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message || "Impossible de créer la règle d'alerte",
        variant: "destructive",
      });
    },
  });

  const toggleAlertRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/alert-rules/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la règle d'alerte",
        variant: "destructive",
      });
    },
  });

  const deleteAlertRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/alert-rules/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Règle d'alerte supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la règle d'alerte",
        variant: "destructive",
      });
    },
  });

  const updateAlertRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/alert-rules/${id}`, data);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Règle d'alerte mise à jour",
        description: `"${data.name}" a été mise à jour avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/alert-rules"] });
      setEditingRuleId(null);
      setEditingRuleData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour la règle d'alerte",
        variant: "destructive",
      });
    },
  });

  // Mutations for managing account categories
  const updateAccountCategoriesMutation = useMutation({
    mutationFn: async ({
      accountId,
      categoryIds,
    }: {
      accountId: string;
      categoryIds: string[];
    }) => {
      return await apiRequest(
        "PUT",
        `/api/email-accounts/${accountId}/categories`,
        { categoryIds },
      );
    },
    onSuccess: () => {
      toast({ title: "Catégories mises à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-accounts"] });
      setEditingAccountId(null);
      setSelectedCategoryIds([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les catégories",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
          Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos comptes email et paramètres de l'application
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 md:space-y-6"
      >
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 md:flex md:w-auto h-auto gap-1">
          <TabsTrigger
            value="email"
            data-testid="tab-email"
            className="text-xs sm:text-sm"
          >
            Comptes Email
          </TabsTrigger>
          <TabsTrigger
            value="categories"
            data-testid="tab-categories"
            className="text-xs sm:text-sm"
          >
            Catégories
          </TabsTrigger>
          <TabsTrigger
            value="automation"
            data-testid="tab-automation"
            className="text-xs sm:text-sm"
          >
            Automatisation
          </TabsTrigger>
          <TabsTrigger
            value="cloud"
            data-testid="tab-cloud"
            className="text-xs sm:text-sm"
          >
            Stockage Cloud
          </TabsTrigger>
          {(user as any)?.role === "admin" && (
            <TabsTrigger
              value="alerts"
              data-testid="tab-alerts"
              className="text-xs sm:text-sm"
            >
              Alertes
            </TabsTrigger>
          )}
          <TabsTrigger
            value="general"
            data-testid="tab-general"
            className="text-xs sm:text-sm"
          >
            Général
          </TabsTrigger>
        </TabsList>

        {/* Email Accounts Tab */}
        <TabsContent value="email" className="space-y-6">
          {/* Add New Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ajouter un compte email</CardTitle>
              <CardDescription>
                Configurez Gmail, Outlook ou Yahoo via IMAP/SMTP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {newAccount.provider === "gmail" && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Gmail nécessite un App Password</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-sm">
                      Pour vous connecter à Gmail, vous devez utiliser un{" "}
                      <strong>mot de passe d'application</strong> au lieu de
                      votre mot de passe habituel.
                    </p>
                    <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                      <li>
                        Activez la validation en deux étapes sur votre compte
                        Google
                      </li>
                      <li>
                        Allez sur{" "}
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          myaccount.google.com/apppasswords
                        </a>
                      </li>
                      <li>Créez un mot de passe pour "Mail"</li>
                      <li>
                        Copiez le mot de passe de 16 caractères et utilisez-le
                        ci-dessous
                      </li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
              {newAccount.provider === "yahoo" && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Yahoo nécessite un App Password</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p className="text-sm">
                      Pour vous connecter à Yahoo, vous devez générer un{" "}
                      <strong>mot de passe d'application</strong>.
                    </p>
                    <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                      <li>
                        Allez sur{" "}
                        <a
                          href="https://login.yahoo.com/account/security"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:no-underline"
                        >
                          login.yahoo.com/account/security
                        </a>
                      </li>
                      <li>
                        Cliquez sur "Générer un mot de passe d'application"
                      </li>
                      <li>
                        Sélectionnez "Autre application" et nommez-le (ex: "PME
                        Assistant")
                      </li>
                      <li>Utilisez le mot de passe généré ci-dessous</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Fournisseur</Label>
                  <Select
                    value={newAccount.provider}
                    onValueChange={(value) => {
                      let config;
                      if (value === "gmail") {
                        config = {
                          imapHost: "imap.gmail.com",
                          imapPort: "993",
                          smtpHost: "smtp.gmail.com",
                          smtpPort: "587",
                        };
                      } else if (value === "outlook") {
                        config = {
                          imapHost: "outlook.office365.com",
                          imapPort: "993",
                          smtpHost: "smtp.office365.com",
                          smtpPort: "587",
                        };
                      } else if (value === "yahoo") {
                        config = {
                          imapHost: "imap.mail.yahoo.com",
                          imapPort: "993",
                          smtpHost: "smtp.mail.yahoo.com",
                          smtpPort: "465",
                        };
                      } else {
                        config = {
                          imapHost: "",
                          imapPort: "993",
                          smtpHost: "",
                          smtpPort: "587",
                        };
                      }
                      setNewAccount({
                        ...newAccount,
                        provider: value,
                        ...config,
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                      <SelectItem value="yahoo">Yahoo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAccount.email}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, email: e.target.value })
                    }
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={newAccount.username}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, username: e.target.value })
                    }
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe / App password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAccount.password}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, password: e.target.value })
                    }
                    data-testid="input-password"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label>Catégories actives pour ce compte</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Sélectionnez les catégories que ce compte pourra utiliser pour
                  classifier les emails
                </p>
                {categoriesLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border border-border rounded-md max-h-48 overflow-y-auto">
                    {emailCategories && emailCategories.length > 0 ? (
                      emailCategories.map((category: any) => (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`new-cat-${category.id}`}
                            checked={selectedCategoryIds.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategoryIds([
                                  ...selectedCategoryIds,
                                  category.id,
                                ]);
                              } else {
                                setSelectedCategoryIds(
                                  selectedCategoryIds.filter(
                                    (id) => id !== category.id,
                                  ),
                                );
                              }
                            }}
                            data-testid={`checkbox-category-${category.key}`}
                          />
                          <Label
                            htmlFor={`new-cat-${category.id}`}
                            className="text-sm cursor-pointer flex items-center gap-2"
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.label}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground col-span-2">
                        Aucune catégorie disponible. Créez-en dans l'onglet
                        Catégories.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={() =>
                  addAccountMutation.mutate({
                    ...newAccount,
                    imapPort: parseInt(newAccount.imapPort),
                    smtpPort: parseInt(newAccount.smtpPort),
                  })
                }
                disabled={addAccountMutation.isPending || !newAccount.email}
                data-testid="button-add-account"
              >
                <Mail className="h-4 w-4 mr-2" />
                Ajouter le compte
              </Button>
            </CardContent>
          </Card>

          {/* Existing Accounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl">Comptes configurés</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {emailAccountsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : emailAccounts && emailAccounts.length > 0 ? (
                <div className="space-y-3">
                  {emailAccounts.map((account: any) => (
                    <div
                      key={account.id}
                      className="flex flex-col sm:flex-row sm:items-center p-4 border border-border rounded-md gap-3"
                      data-testid={`account-${account.id}`}
                    >
                      <div className="flex-1">
                        <div className="font-medium break-all">
                          {account.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.provider} • Scan: {account.scanFrequency}min
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAccountSettings({
                              id: account.id,
                              scanFrequency: account.scanFrequency || 15,
                              retentionDays: account.retentionDays || 90,
                            });
                          }}
                          data-testid={`button-edit-settings-${account.id}`}
                        >
                          <SettingsIcon className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Paramètres</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Fetch current categories for this account
                            const response = await fetch(
                              `/api/email-accounts/${account.id}/categories`,
                              {
                                credentials: "include",
                              },
                            );
                            const categories = await response.json();
                            setSelectedCategoryIds(
                              categories.map((c: any) => c.id),
                            );
                            setEditingAccountId(account.id);
                          }}
                          data-testid={`button-manage-categories-${account.id}`}
                        >
                          <Tag className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Catégories</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => scanAccountMutation.mutate(account.id)}
                          disabled={scanningAccountId === account.id}
                          data-testid={`button-scan-${account.id}`}
                        >
                          {scanningAccountId === account.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 sm:mr-2 animate-spin" />
                              <span className="hidden sm:inline">Scan...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 sm:mr-2 " />
                              <span className="hidden sm:inline">Scanner</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteAccountMutation.mutate(account.id)
                          }
                          disabled={deleteAccountMutation.isPending}
                          data-testid={`button-delete-${account.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Aucun compte configuré
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog for managing account categories */}
          <Dialog
            open={editingAccountId !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditingAccountId(null);
                setSelectedCategoryIds([]);
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gérer les catégories du compte</DialogTitle>
                <DialogDescription>
                  Sélectionnez les catégories que ce compte pourra utiliser
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {categoriesLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="grid grid-cols-1 gap-2 p-3 border border-border rounded-md">
                    {emailCategories && emailCategories.length > 0 ? (
                      emailCategories.map((category: any) => (
                        <div
                          key={category.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`edit-cat-${category.id}`}
                            checked={selectedCategoryIds.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategoryIds([
                                  ...selectedCategoryIds,
                                  category.id,
                                ]);
                              } else {
                                setSelectedCategoryIds(
                                  selectedCategoryIds.filter(
                                    (id) => id !== category.id,
                                  ),
                                );
                              }
                            }}
                            data-testid={`checkbox-edit-category-${category.key}`}
                          />
                          <Label
                            htmlFor={`edit-cat-${category.id}`}
                            className="text-sm cursor-pointer flex items-center gap-2"
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.label}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Aucune catégorie disponible
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAccountId(null);
                    setSelectedCategoryIds([]);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (editingAccountId) {
                      updateAccountCategoriesMutation.mutate({
                        accountId: editingAccountId,
                        categoryIds: selectedCategoryIds,
                      });
                    }
                  }}
                  disabled={updateAccountCategoriesMutation.isPending}
                  data-testid="button-save-categories"
                >
                  {updateAccountCategoriesMutation.isPending
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for editing account settings */}
          <Dialog
            open={editingAccountSettings !== null}
            onOpenChange={(open) => {
              if (!open) {
                setEditingAccountSettings(null);
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Paramètres du compte</DialogTitle>
                <DialogDescription>
                  Configurez la fréquence de scan et la durée de rétention des emails
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scanFrequency">Fréquence de scan (minutes)</Label>
                  <Input
                    id="scanFrequency"
                    type="number"
                    min="1"
                    max="1440"
                    value={editingAccountSettings?.scanFrequency || 15}
                    onChange={(e) => {
                      if (editingAccountSettings) {
                        setEditingAccountSettings({
                          ...editingAccountSettings,
                          scanFrequency: parseInt(e.target.value) || 15,
                        });
                      }
                    }}
                    data-testid="input-scan-frequency"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fréquence à laquelle les nouveaux emails sont scannés (1-1440 minutes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Durée de rétention (jours)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min="1"
                    max="3650"
                    value={editingAccountSettings?.retentionDays || 90}
                    onChange={(e) => {
                      if (editingAccountSettings) {
                        setEditingAccountSettings({
                          ...editingAccountSettings,
                          retentionDays: parseInt(e.target.value) || 90,
                        });
                      }
                    }}
                    data-testid="input-retention-days"
                  />
                  <p className="text-xs text-muted-foreground">
                    Durée de conservation des emails (1-3650 jours, défaut: 90 jours soit 3 mois)
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingAccountSettings(null)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    if (editingAccountSettings) {
                      updateAccountSettingsMutation.mutate(editingAccountSettings);
                    }
                  }}
                  disabled={updateAccountSettingsMutation.isPending}
                  data-testid="button-save-account-settings"
                >
                  {updateAccountSettingsMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Ajouter une catégorie personnalisée
              </CardTitle>
              <CardDescription>
                Créez des catégories pour classifier vos emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-key">Clé (identifiant unique)</Label>
                  <Input
                    id="category-key"
                    placeholder="ex: contrat"
                    value={newCategory.key}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, key: e.target.value })
                    }
                    data-testid="input-category-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-label">Libellé</Label>
                  <Input
                    id="category-label"
                    placeholder="ex: Contrats"
                    value={newCategory.label}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, label: e.target.value })
                    }
                    data-testid="input-category-label"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-color">Couleur</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          data-testid="button-select-color"
                        >
                          <div
                            className="w-6 h-6 rounded-md mr-2 border border-border"
                            style={{ backgroundColor: newCategory.color }}
                          />
                          {newCategory.color}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm mb-2">Couleurs prédéfinies</Label>
                            <div className="grid grid-cols-8 gap-2 mt-2">
                              {PRESET_COLORS.map((color) => (
                                <button
                                  key={color}
                                  className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform"
                                  style={{
                                    backgroundColor: color,
                                    borderColor: newCategory.color === color ? "hsl(var(--primary))" : "transparent"
                                  }}
                                  onClick={() => setNewCategory({ ...newCategory, color })}
                                  data-testid={`color-${color}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="custom-color" className="text-sm">Couleur personnalisée</Label>
                            <div className="flex gap-2 mt-2">
                              <input
                                type="color"
                                id="custom-color"
                                value={newCategory.color}
                                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                className="w-12 h-10 rounded cursor-pointer border border-border"
                                data-testid="input-color-picker"
                              />
                              <Input
                                value={newCategory.color}
                                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                placeholder="#6366f1"
                                className="flex-1"
                                data-testid="input-category-color"
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-icon">Icône</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        data-testid="button-select-icon"
                      >
                        {(() => {
                          const IconComponent = AVAILABLE_ICONS.find(i => i.name === newCategory.icon)?.component || Tag;
                          return <IconComponent className="w-5 h-5 mr-2" />;
                        })()}
                        {newCategory.icon}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <Label className="text-sm">Sélectionnez une icône</Label>
                        <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                          {AVAILABLE_ICONS.map(({ name, component: IconComponent }) => (
                            <button
                              key={name}
                              className={`p-3 rounded-md border-2 hover:bg-accent transition-colors ${
                                newCategory.icon === name ? "border-primary bg-accent" : "border-transparent"
                              }`}
                              onClick={() => setNewCategory({ ...newCategory, icon: name })}
                              title={name}
                              data-testid={`icon-${name}`}
                            >
                              <IconComponent className="w-5 h-5" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-auto-response"
                  checked={newCategory.generateAutoResponse}
                  onCheckedChange={(checked) =>
                    setNewCategory({
                      ...newCategory,
                      generateAutoResponse: checked as boolean,
                    })
                  }
                  data-testid="checkbox-generate-auto-response"
                />
                <Label
                  htmlFor="generate-auto-response"
                  className="text-sm font-normal"
                >
                  Générer une réponse automatique pour cette catégorie
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-create-task"
                  checked={newCategory.autoCreateTask}
                  onCheckedChange={(checked) =>
                    setNewCategory({
                      ...newCategory,
                      autoCreateTask: checked as boolean,
                    })
                  }
                  data-testid="checkbox-auto-create-task"
                />
                <Label
                  htmlFor="auto-create-task"
                  className="text-sm font-normal"
                >
                  Créer automatiquement une tâche pour chaque email de cette catégorie
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-mark-as-processed"
                  checked={newCategory.autoMarkAsProcessed}
                  onCheckedChange={(checked) =>
                    setNewCategory({
                      ...newCategory,
                      autoMarkAsProcessed: checked as boolean,
                    })
                  }
                  data-testid="checkbox-auto-mark-as-processed"
                />
                <Label
                  htmlFor="auto-mark-as-processed"
                  className="text-sm font-normal"
                >
                  Marquer automatiquement les emails scannés comme traités
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="redirect-emails">Emails de redirection des pièces jointes</Label>
                <Input
                  id="redirect-emails"
                  placeholder="ex: finance@entreprise.fr, rh@entreprise.fr"
                  value={newCategory.redirectEmails.join(", ")}
                  onChange={(e) => {
                    const emails = e.target.value
                      .split(",")
                      .map(email => email.trim())
                      .filter(email => email.length > 0);
                    setNewCategory({ ...newCategory, redirectEmails: emails });
                  }}
                  data-testid="input-redirect-emails"
                />
                <p className="text-xs text-muted-foreground">
                  Adresses email vers lesquelles transférer automatiquement les pièces jointes de cette catégorie (séparées par des virgules)
                </p>
              </div>
              <Button
                onClick={() => addCategoryMutation.mutate(newCategory)}
                disabled={
                  addCategoryMutation.isPending ||
                  !newCategory.key ||
                  !newCategory.label
                }
                data-testid="button-add-category"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la catégorie
              </Button>
            </CardContent>
          </Card>

          {/* Existing Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Catégories configurées</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {emailCategories && emailCategories.length > 0 ? (
                    emailCategories.map((category: any) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border border-border rounded-md hover-elevate"
                        data-testid={`category-item-${category.key}`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-md flex items-center justify-center text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {(() => {
                              const IconComponent = AVAILABLE_ICONS.find(i => i.name === category.icon)?.component || Tag;
                              return <IconComponent className="h-5 w-5" />;
                            })()}
                          </div>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-sm text-muted-foreground">
                              Clé: {category.key} •{" "}
                              {category.generateAutoResponse
                                ? "Réponse auto ✓"
                                : "Réponse auto ✗"} •{" "}
                              {category.autoCreateTask
                                ? "Tâches auto ✓"
                                : "Tâches auto ✗"} •{" "}
                              {category.autoMarkAsProcessed
                                ? "Traités auto ✓"
                                : "Traités auto ✗"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingCategory(category)}
                            data-testid={`button-edit-category-${category.key}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteCategoryMutation.mutate(category.id)
                            }
                            disabled={
                              category.isSystem ||
                              deleteCategoryMutation.isPending
                            }
                            data-testid={`button-delete-category-${category.key}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucune catégorie configurée
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Category Dialog */}
          <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier la catégorie</DialogTitle>
                <DialogDescription>
                  Modifiez les paramètres de la catégorie
                </DialogDescription>
              </DialogHeader>
              {editingCategory && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category-key">Clé (identifiant unique)</Label>
                      <Input
                        id="edit-category-key"
                        value={editingCategory.key}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, key: e.target.value })
                        }
                        placeholder="ex: devis, facture"
                        data-testid="input-edit-category-key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category-label">Libellé</Label>
                      <Input
                        id="edit-category-label"
                        value={editingCategory.label}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, label: e.target.value })
                        }
                        placeholder="ex: Devis, Facture"
                        data-testid="input-edit-category-label"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category-color">Couleur</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              data-testid="button-edit-select-color"
                            >
                              <div
                                className="w-6 h-6 rounded-md mr-2 border border-border"
                                style={{ backgroundColor: editingCategory.color }}
                              />
                              {editingCategory.color}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64">
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm mb-2">Couleurs prédéfinies</Label>
                                <div className="grid grid-cols-8 gap-2 mt-2">
                                  {PRESET_COLORS.map((color) => (
                                    <button
                                      key={color}
                                      className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform"
                                      style={{
                                        backgroundColor: color,
                                        borderColor: editingCategory.color === color ? "hsl(var(--primary))" : "transparent"
                                      }}
                                      onClick={() => setEditingCategory({ ...editingCategory, color })}
                                      data-testid={`edit-color-${color}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="edit-custom-color" className="text-sm">Couleur personnalisée</Label>
                                <div className="flex gap-2 mt-2">
                                  <input
                                    type="color"
                                    id="edit-custom-color"
                                    value={editingCategory.color}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                    className="w-12 h-10 rounded cursor-pointer border border-border"
                                    data-testid="input-edit-color-picker"
                                  />
                                  <Input
                                    value={editingCategory.color}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                                    placeholder="#6366f1"
                                    className="flex-1"
                                    data-testid="input-edit-category-color"
                                  />
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-category-icon">Icône</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            data-testid="button-edit-select-icon"
                          >
                            {(() => {
                              const IconComponent = AVAILABLE_ICONS.find(i => i.name === editingCategory.icon)?.component || Tag;
                              return <IconComponent className="w-5 h-5 mr-2" />;
                            })()}
                            {editingCategory.icon}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <Label className="text-sm">Sélectionnez une icône</Label>
                            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                              {AVAILABLE_ICONS.map(({ name, component: IconComponent }) => (
                                <button
                                  key={name}
                                  className={`p-3 rounded-md border-2 hover:bg-accent transition-colors ${
                                    editingCategory.icon === name ? "border-primary bg-accent" : "border-transparent"
                                  }`}
                                  onClick={() => setEditingCategory({ ...editingCategory, icon: name })}
                                  title={name}
                                  data-testid={`edit-icon-${name}`}
                                >
                                  <IconComponent className="w-5 h-5" />
                                </button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-generate-auto-response"
                      checked={editingCategory.generateAutoResponse}
                      onCheckedChange={(checked) =>
                        setEditingCategory({
                          ...editingCategory,
                          generateAutoResponse: checked as boolean,
                        })
                      }
                      data-testid="checkbox-edit-generate-auto-response"
                    />
                    <Label
                      htmlFor="edit-generate-auto-response"
                      className="text-sm font-normal"
                    >
                      Générer une réponse automatique pour cette catégorie
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-auto-create-task"
                      checked={editingCategory.autoCreateTask}
                      onCheckedChange={(checked) =>
                        setEditingCategory({
                          ...editingCategory,
                          autoCreateTask: checked as boolean,
                        })
                      }
                      data-testid="checkbox-edit-auto-create-task"
                    />
                    <Label
                      htmlFor="edit-auto-create-task"
                      className="text-sm font-normal"
                    >
                      Créer automatiquement une tâche pour chaque email de cette catégorie
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-auto-mark-as-processed"
                      checked={editingCategory.autoMarkAsProcessed}
                      onCheckedChange={(checked) =>
                        setEditingCategory({
                          ...editingCategory,
                          autoMarkAsProcessed: checked as boolean,
                        })
                      }
                      data-testid="checkbox-edit-auto-mark-as-processed"
                    />
                    <Label
                      htmlFor="edit-auto-mark-as-processed"
                      className="text-sm font-normal"
                    >
                      Marquer automatiquement les emails scannés comme traités
                    </Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-redirect-emails">Emails de redirection des pièces jointes</Label>
                    <Input
                      id="edit-redirect-emails"
                      placeholder="ex: finance@entreprise.fr, rh@entreprise.fr"
                      value={(editingCategory.redirectEmails || []).join(", ")}
                      onChange={(e) => {
                        const emails = e.target.value
                          .split(",")
                          .map(email => email.trim())
                          .filter(email => email.length > 0);
                        setEditingCategory({ ...editingCategory, redirectEmails: emails });
                      }}
                      data-testid="input-edit-redirect-emails"
                    />
                    <p className="text-xs text-muted-foreground">
                      Adresses email vers lesquelles transférer automatiquement les pièces jointes de cette catégorie (séparées par des virgules)
                    </p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingCategory(null)}
                  data-testid="button-cancel-edit-category"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() =>
                    updateCategoryMutation.mutate({
                      id: editingCategory.id,
                      data: {
                        key: editingCategory.key,
                        label: editingCategory.label,
                        color: editingCategory.color,
                        icon: editingCategory.icon,
                        generateAutoResponse: editingCategory.generateAutoResponse,
                        autoCreateTask: editingCategory.autoCreateTask,
                        autoMarkAsProcessed: editingCategory.autoMarkAsProcessed,
                        redirectEmails: editingCategory.redirectEmails || [],
                      },
                    })
                  }
                  disabled={
                    updateCategoryMutation.isPending ||
                    !editingCategory?.key ||
                    !editingCategory?.label
                  }
                  data-testid="button-save-edit-category"
                >
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Paramètres d'automatisation
              </CardTitle>
              <CardDescription>
                Configurez les fonctionnalités intelligentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base">
                    Analyse automatique des emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Détection automatique du type d'email et extraction de
                    données
                  </p>
                </div>
                <Switch
                  checked={settings?.autoAnalysis !== false}
                  onCheckedChange={(checked) =>
                    updateSettingMutation.mutate({
                      key: "autoAnalysis",
                      value: checked,
                    })
                  }
                  data-testid="switch-auto-analysis"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base">Réponses automatiques</Label>
                  <p className="text-sm text-muted-foreground">
                    Génération de réponses suggérées par IA
                  </p>
                </div>
                <Switch
                  checked={settings?.autoResponses !== false}
                  onCheckedChange={(checked) =>
                    updateSettingMutation.mutate({
                      key: "autoResponses",
                      value: checked,
                    })
                  }
                  data-testid="switch-auto-responses"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base">
                    Planification automatique des RDV
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Création automatique de rendez-vous depuis les emails
                  </p>
                </div>
                <Switch
                  checked={settings?.autoScheduling !== false}
                  onCheckedChange={(checked) =>
                    updateSettingMutation.mutate({
                      key: "autoScheduling",
                      value: checked,
                    })
                  }
                  data-testid="switch-auto-scheduling"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Extraction et stockage de documents
              </CardTitle>
              <CardDescription>
                Configurez l'extraction automatique et le stockage des pièces jointes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base">
                    Extraction automatique des documents
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Extraire et classer automatiquement les pièces jointes des emails
                  </p>
                </div>
                <Switch
                  checked={settings?.documentExtractionEnabled === true}
                  onCheckedChange={(checked) =>
                    updateSettingMutation.mutate({
                      key: "documentExtractionEnabled",
                      value: checked,
                    })
                  }
                  data-testid="switch-document-extraction"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage-provider">Fournisseur de stockage</Label>
                <Select
                  value={settings?.documentStorageProvider || "google_drive"}
                  onValueChange={(value) =>
                    updateSettingMutation.mutate({
                      key: "documentStorageProvider",
                      value: value,
                    })
                  }
                >
                  <SelectTrigger id="storage-provider" data-testid="select-storage-provider">
                    <SelectValue placeholder="Sélectionnez un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google_drive" data-testid="option-google-drive">
                      Google Drive
                    </SelectItem>
                    <SelectItem value="onedrive" data-testid="option-onedrive">
                      OneDrive
                    </SelectItem>
                    <SelectItem value="disabled" data-testid="option-disabled">
                      Désactivé
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez le service cloud pour stocker les documents extraits
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cloud Storage Tab */}
        <TabsContent value="cloud" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Configuration personnelle du stockage cloud</AlertTitle>
            <AlertDescription>
              Connectez vos propres comptes Google Drive ou OneDrive pour stocker les documents extraits des emails. 
              Ces configurations sont personnelles et sécurisées.
            </AlertDescription>
          </Alert>

          <CloudStorageConfigForm />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Alert>
            <Bell className="h-4 w-4" />
            <AlertTitle>
              Règles d'alerte personnalisées (Administrateurs uniquement)
            </AlertTitle>
            <AlertDescription>
              Créez des règles d'alerte intelligentes en langage naturel. L'IA
              interprétera vos instructions et créera automatiquement des
              alertes basées sur vos critères.
            </AlertDescription>
          </Alert>

          {/* Create New Alert Rule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Créer une règle d'alerte
              </CardTitle>
              <CardDescription>
                Décrivez en français la règle d'alerte que vous souhaitez créer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert-prompt">Prompt en langage naturel</Label>
                <textarea
                  id="alert-prompt"
                  value={alertPrompt}
                  onChange={(e) => setAlertPrompt(e.target.value)}
                  placeholder="Exemple : Alertes pour emails de facture qui n'ont pas été traités depuis plus de 7 jours avec une priorité élevée"
                  className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-none"
                  data-testid="input-alert-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  Exemples de prompts :
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 ml-2">
                  <li>
                    Alerte pour emails urgents de type devis qui ne sont pas
                    traités depuis plus de 24 heures
                  </li>
                  <li>
                    Rappel pour rendez-vous confirmés qui commencent dans moins
                    de 2 heures
                  </li>
                  <li>
                    Alerte critique pour emails de facture reçus il y a plus de
                    10 jours et toujours en status nouveau
                  </li>
                </ul>
              </div>
              <Button
                onClick={() =>
                  alertPrompt.trim() &&
                  createAlertRuleMutation.mutate(alertPrompt.trim())
                }
                disabled={
                  createAlertRuleMutation.isPending || !alertPrompt.trim()
                }
                data-testid="button-create-alert-rule"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createAlertRuleMutation.isPending
                  ? "Création en cours..."
                  : "Créer la règle"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Alert Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Règles d'alerte existantes
              </CardTitle>
              <CardDescription>
                Gérez vos règles d'alerte personnalisées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alertRulesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !alertRules || (alertRules as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune règle d'alerte personnalisée. Créez-en une ci-dessus.
                </p>
              ) : (
                <div className="space-y-3">
                  {(alertRules as any[]).map((rule: any) => (
                    <div
                      key={rule.id}
                      className="p-4 border rounded-lg space-y-3"
                      data-testid={`alert-rule-${rule.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{rule.name}</h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                rule.severity === "critical"
                                  ? "bg-destructive/10 text-destructive"
                                  : rule.severity === "warning"
                                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-500"
                              }`}
                            >
                              {rule.severity === "critical"
                                ? "Critique"
                                : rule.severity === "warning"
                                  ? "Attention"
                                  : "Info"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground italic">
                            "{rule.prompt}"
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={(checked) =>
                              toggleAlertRuleMutation.mutate({
                                id: rule.id,
                                isActive: checked,
                              })
                            }
                            disabled={toggleAlertRuleMutation.isPending}
                            data-testid={`switch-rule-${rule.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingRuleId(rule.id);
                              setEditingRuleData({
                                prompt: rule.prompt,
                                checkIntervalMinutes: rule.checkIntervalMinutes || 60,
                              });
                            }}
                            data-testid={`button-edit-rule-${rule.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              deleteAlertRuleMutation.mutate(rule.id)
                            }
                            disabled={deleteAlertRuleMutation.isPending}
                            data-testid={`button-delete-rule-${rule.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <strong>Détails :</strong>{" "}
                        {JSON.stringify(rule.ruleData, null, 2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Alert Rule Dialog */}
          <Dialog open={editingRuleId !== null} onOpenChange={(open) => {
            if (!open) {
              setEditingRuleId(null);
              setEditingRuleData(null);
            }
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier la règle d'alerte</DialogTitle>
                <DialogDescription>
                  Modifiez le prompt ou l'intervalle de vérification de la règle
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-prompt">Prompt en langage naturel</Label>
                  <textarea
                    id="edit-prompt"
                    value={editingRuleData?.prompt || ""}
                    onChange={(e) => setEditingRuleData({
                      ...editingRuleData,
                      prompt: e.target.value
                    })}
                    placeholder="Décrivez votre règle d'alerte en français"
                    className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-none"
                    data-testid="input-edit-rule-prompt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-interval">Intervalle de vérification (minutes)</Label>
                  <Input
                    id="edit-interval"
                    type="number"
                    min="5"
                    max="1440"
                    value={editingRuleData?.checkIntervalMinutes || 60}
                    onChange={(e) => setEditingRuleData({
                      ...editingRuleData,
                      checkIntervalMinutes: parseInt(e.target.value) || 60
                    })}
                    data-testid="input-edit-rule-interval"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fréquence à laquelle cette règle sera vérifiée (entre 5 minutes et 24 heures)
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingRuleId(null);
                      setEditingRuleData(null);
                    }}
                    data-testid="button-cancel-edit-rule"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingRuleId && editingRuleData) {
                        updateAlertRuleMutation.mutate({
                          id: editingRuleId,
                          data: editingRuleData
                        });
                      }
                    }}
                    disabled={updateAlertRuleMutation.isPending || !editingRuleData?.prompt?.trim()}
                    data-testid="button-save-edit-rule"
                  >
                    {updateAlertRuleMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Paramètres généraux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-rdv-duration">
                  Durée par défaut des RDV (minutes)
                </Label>
                <Input
                  id="default-rdv-duration"
                  type="number"
                  defaultValue={settings?.defaultAppointmentDuration || 60}
                  onBlur={(e) =>
                    updateSettingMutation.mutate({
                      key: "defaultAppointmentDuration",
                      value: parseInt(e.target.value),
                    })
                  }
                  data-testid="input-rdv-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-deadline">
                  Délai d'alerte email non traité (heures)
                </Label>
                <Input
                  id="alert-deadline"
                  type="number"
                  defaultValue={settings?.emailAlertDeadline || 48}
                  onBlur={(e) =>
                    updateSettingMutation.mutate({
                      key: "emailAlertDeadline",
                      value: parseInt(e.target.value),
                    })
                  }
                  data-testid="input-alert-deadline"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
