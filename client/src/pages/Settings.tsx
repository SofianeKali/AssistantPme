import { useState } from "react";
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
import { Mail, Save, Trash2, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { toast } = useToast();
  const { data: emailAccounts, isLoading: emailAccountsLoading } = useQuery({
    queryKey: ["/api/email-accounts"],
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/settings"],
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
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le compte email",
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

  const scanEmailsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/email-scan", {});
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Scan terminé", 
        description: `${data.summary.totalCreated} nouveaux emails importés` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de scanner les emails",
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

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList>
          <TabsTrigger value="email" data-testid="tab-email">Comptes Email</TabsTrigger>
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
