import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, Save, Trash2, RefreshCw, Info, Plus, Tag, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Settings() {
  const { toast } = useToast();
  const { data: emailAccounts, isLoading: emailAccountsLoading } = useQuery({
    queryKey: ["/api/email-accounts"],
  });

  const { data: settings, isLoading: settingsLoading} = useQuery({
    queryKey: ["/api/settings"],
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("email");

  // Auto-select first account when accounts load
  useEffect(() => {
    if (emailAccounts && (emailAccounts as any[]).length > 0 && !selectedAccountId) {
      setSelectedAccountId((emailAccounts as any[])[0].id);
    }
  }, [emailAccounts, selectedAccountId]);

  const { data: emailCategories, isLoading: categoriesLoading } = useQuery<any>({
    queryKey: ["/api/email-categories", selectedAccountId],
    queryFn: async () => {
      const url = selectedAccountId 
        ? `/api/email-categories?emailAccountId=${selectedAccountId}`
        : '/api/email-categories';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    enabled: !!selectedAccountId, // Only fetch when an account is selected
  });

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
  });

  const addAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/email-accounts", data);
    },
    onSuccess: () => {
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
    },
    onError: (error: any) => {
      let errorMessage = "Impossible d'ajouter le compte email";
      
      // Provide helpful error messages based on error type
      if (error?.message?.includes("Invalid credentials") || error?.message?.includes("AUTHENTICATIONFAILED")) {
        if (newAccount.provider === "gmail") {
          errorMessage = "Authentification échouée. Pour Gmail, utilisez un App Password (voir le guide ci-dessus)";
        } else if (newAccount.provider === "yahoo") {
          errorMessage = "Authentification échouée. Pour Yahoo, utilisez un App Password (voir le guide ci-dessus)";
        } else {
          errorMessage = "Identifiants incorrects. Vérifiez votre nom d'utilisateur et mot de passe";
        }
      } else if (error?.message?.includes("ENOTFOUND") || error?.message?.includes("ECONNREFUSED")) {
        errorMessage = "Impossible de se connecter au serveur email. Vérifiez les paramètres IMAP/SMTP";
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
      return await apiRequest("PUT", `/api/settings/${data.key}`, { value: data.value });
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

  const addCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Include emailAccountId when creating a custom category
      const categoryData = {
        ...data,
        emailAccountId: selectedAccountId,
      };
      return await apiRequest("POST", "/api/email-categories", categoryData);
    },
    onSuccess: () => {
      toast({ title: "Catégorie ajoutée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-categories", selectedAccountId] });
      setNewCategory({
        key: "",
        label: "",
        color: "#6366f1",
        icon: "Mail",
        isSystem: false,
        generateAutoResponse: true,
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

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/email-categories/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Catégorie supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/email-categories", selectedAccountId] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie système",
        variant: "destructive",
      });
    },
  });

  const scanEmailsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/email-scan", {});
    },
    onSuccess: (data: any) => {
      if (data.summary.totalErrors > 0) {
        toast({ 
          title: "Scan terminé avec des erreurs", 
          description: `${data.summary.totalCreated} emails importés, ${data.summary.totalErrors} erreur(s). Vérifiez les identifiants de vos comptes.`,
          variant: "destructive",
        });
      } else {
        toast({ 
          title: "Scan terminé", 
          description: `${data.summary.totalCreated} nouveaux emails importés` 
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
    onError: (error: any) => {
      let errorMessage = "Impossible de scanner les emails";
      
      if (error?.message?.includes("Invalid credentials") || error?.message?.includes("AUTHENTICATIONFAILED")) {
        errorMessage = "Erreur d'authentification. Vérifiez vos App Passwords Gmail/Yahoo";
      }
      
      toast({
        title: "Erreur de scan",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos comptes email et paramètres de l'application
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="email" data-testid="tab-email">Comptes Email</TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">Catégories</TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">Automatisation</TabsTrigger>
          <TabsTrigger value="general" data-testid="tab-general">Général</TabsTrigger>
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
                      Pour vous connecter à Gmail, vous devez utiliser un <strong>mot de passe d'application</strong> au lieu de votre mot de passe habituel.
                    </p>
                    <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                      <li>Activez la validation en deux étapes sur votre compte Google</li>
                      <li>Allez sur <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">myaccount.google.com/apppasswords</a></li>
                      <li>Créez un mot de passe pour "Mail"</li>
                      <li>Copiez le mot de passe de 16 caractères et utilisez-le ci-dessous</li>
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
                      Pour vous connecter à Yahoo, vous devez générer un <strong>mot de passe d'application</strong>.
                    </p>
                    <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                      <li>Allez sur <a href="https://login.yahoo.com/account/security" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">login.yahoo.com/account/security</a></li>
                      <li>Cliquez sur "Générer un mot de passe d'application"</li>
                      <li>Sélectionnez "Autre application" et nommez-le (ex: "PME Assistant")</li>
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
                        config = { imapHost: "imap.gmail.com", imapPort: "993", smtpHost: "smtp.gmail.com", smtpPort: "587" };
                      } else if (value === "outlook") {
                        config = { imapHost: "outlook.office365.com", imapPort: "993", smtpHost: "smtp.office365.com", smtpPort: "587" };
                      } else if (value === "yahoo") {
                        config = { imapHost: "imap.mail.yahoo.com", imapPort: "993", smtpHost: "smtp.mail.yahoo.com", smtpPort: "465" };
                      } else {
                        config = { imapHost: "", imapPort: "993", smtpHost: "", smtpPort: "587" };
                      }
                      setNewAccount({ ...newAccount, provider: value, ...config });
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
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                    data-testid="input-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe / App password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    data-testid="input-password"
                  />
                </div>
              </div>
              
              <Button
                onClick={() => addAccountMutation.mutate({
                  ...newAccount,
                  imapPort: parseInt(newAccount.imapPort),
                  smtpPort: parseInt(newAccount.smtpPort),
                })}
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
              <Button
                onClick={() => scanEmailsMutation.mutate()}
                disabled={scanEmailsMutation.isPending || !emailAccounts || emailAccounts.length === 0}
                data-testid="button-scan-emails"
              >
                {scanEmailsMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scan en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Scanner les emails
                  </>
                )}
              </Button>
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
                      className="flex items-center justify-between p-4 border border-border rounded-md"
                      data-testid={`account-${account.id}`}
                    >
                      <div>
                        <div className="font-medium">{account.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.provider} • Scan: {account.scanFrequency}min
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAccountMutation.mutate(account.id)}
                        data-testid={`button-delete-${account.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          {/* Account Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Sélectionner un compte email</CardTitle>
              <CardDescription>
                Les catégories personnalisées sont liées à un compte email spécifique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailAccountsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (!emailAccounts || emailAccounts.length === 0) ? (
                <Alert data-testid="alert-no-email-accounts">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between gap-4">
                    <span>Aucun compte email configuré. Configurez d'abord un compte email pour gérer les catégories.</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("email")}
                      data-testid="button-go-to-email-tab"
                    >
                      Configurer un compte
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger data-testid="select-email-account">
                    <SelectValue placeholder="Choisir un compte email" />
                  </SelectTrigger>
                  <SelectContent>
                    {(emailAccounts as any[] || []).map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.email} ({account.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Ajouter une catégorie personnalisée</CardTitle>
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
                    onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value })}
                    data-testid="input-category-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-label">Libellé</Label>
                  <Input
                    id="category-label"
                    placeholder="ex: Contrats"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                    data-testid="input-category-label"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category-color">Couleur (hex)</Label>
                  <Input
                    id="category-color"
                    placeholder="#6366f1"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    data-testid="input-category-color"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-icon">Icône Lucide</Label>
                  <Input
                    id="category-icon"
                    placeholder="Mail"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    data-testid="input-category-icon"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-auto-response"
                  checked={newCategory.generateAutoResponse}
                  onCheckedChange={(checked) => setNewCategory({ ...newCategory, generateAutoResponse: checked as boolean })}
                  data-testid="checkbox-generate-auto-response"
                />
                <Label htmlFor="generate-auto-response" className="text-sm font-normal">
                  Générer une réponse automatique pour cette catégorie
                </Label>
              </div>
              <Button
                onClick={() => addCategoryMutation.mutate(newCategory)}
                disabled={addCategoryMutation.isPending || !newCategory.key || !newCategory.label || !selectedAccountId}
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
                            <Tag className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-sm text-muted-foreground">
                              Clé: {category.key} • {category.generateAutoResponse ? "Réponse auto activée" : "Réponse auto désactivée"}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                          disabled={category.isSystem || deleteCategoryMutation.isPending}
                          data-testid={`button-delete-category-${category.key}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Paramètres d'automatisation</CardTitle>
              <CardDescription>
                Configurez les fonctionnalités intelligentes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base">Analyse automatique des emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Détection automatique du type d'email et extraction de données
                  </p>
                </div>
                <Switch
                  checked={settings?.autoAnalysis !== false}
                  onCheckedChange={(checked) =>
                    updateSettingMutation.mutate({ key: "autoAnalysis", value: checked })
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
                    updateSettingMutation.mutate({ key: "autoResponses", value: checked })
                  }
                  data-testid="switch-auto-responses"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base">Planification automatique des RDV</Label>
                  <p className="text-sm text-muted-foreground">
                    Création automatique de rendez-vous depuis les emails
                  </p>
                </div>
                <Switch
                  checked={settings?.autoScheduling !== false}
                  onCheckedChange={(checked) =>
                    updateSettingMutation.mutate({ key: "autoScheduling", value: checked })
                  }
                  data-testid="switch-auto-scheduling"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Paramètres généraux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-rdv-duration">Durée par défaut des RDV (minutes)</Label>
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
                <Label htmlFor="alert-deadline">Délai d'alerte email non traité (heures)</Label>
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
