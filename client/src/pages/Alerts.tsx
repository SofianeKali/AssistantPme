import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle, CheckCheck, AlertCircle, Zap, Info, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function Alerts() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("active");
  
  // Reset selection when changing tabs
  useEffect(() => {
    setSelectedAlerts([]);
  }, [activeTab]);

  const { data: activeAlerts, isLoading: activeLoading } = useQuery<any[]>({
    queryKey: ["/api/alerts", { resolved: false }],
  });

  const { data: resolvedAlerts, isLoading: resolvedLoading } = useQuery<any[]>({
    queryKey: ["/api/alerts", { resolved: true }],
  });

  const resolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/alerts/${id}/resolve`, {});
    },
    onSuccess: () => {
      toast({ title: "Alerte résolue" });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const resolveBulkMutation = useMutation({
    mutationFn: async (alertIds: string[]) => {
      return await apiRequest("POST", `/api/alerts/bulk-resolve`, { alertIds });
    },
    onSuccess: (data: any) => {
      toast({ 
        title: "Alertes résolues", 
        description: data.message 
      });
      setSelectedAlerts([]);
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
    onError: () => {
      toast({ 
        title: "Erreur", 
        description: "Impossible de résoudre les alertes",
        variant: "destructive"
      });
    },
  });

  const handleSelectAlert = (alertId: string, checked: boolean) => {
    if (checked) {
      setSelectedAlerts([...selectedAlerts, alertId]);
    } else {
      setSelectedAlerts(selectedAlerts.filter(id => id !== alertId));
    }
  };

  const handleSelectAll = (alerts: any[], checked: boolean) => {
    if (checked) {
      setSelectedAlerts(alerts.map((a: any) => a.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleBulkResolve = () => {
    if (selectedAlerts.length === 0) return;
    resolveBulkMutation.mutate(selectedAlerts);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return AlertCircle;
      case "warning":
        return Zap;
      default:
        return Info;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-red-500";
      case "warning":
        return "border-l-orange-500";
      default:
        return "border-l-blue-500";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Critique</Badge>;
      case "warning":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">Attention</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Info</Badge>;
    }
  };

  const handleAlertClick = (alertId: string) => {
    setLocation(`/emails?alertId=${alertId}`);
  };

  const AlertList = ({ alerts, isLoading, showResolveButton = true }: any) => {
    const allSelected = alerts?.length > 0 && alerts.every((a: any) => selectedAlerts.includes(a.id));
    const someSelected = alerts?.some((a: any) => selectedAlerts.includes(a.id));

    return (
      <div className="space-y-4">
        {/* Bulk actions bar */}
        {showResolveButton && alerts && alerts.length > 0 && (
          <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border transition-all">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => handleSelectAll(alerts, checked as boolean)}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm font-medium text-muted-foreground">
                {selectedAlerts.length > 0 
                  ? `${selectedAlerts.length} alerte(s) sélectionnée(s)`
                  : "Tout sélectionner"}
              </span>
            </div>
            {selectedAlerts.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkResolve}
                disabled={resolveBulkMutation.isPending}
                data-testid="button-bulk-resolve"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Résoudre la sélection
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : alerts && alerts.length > 0 ? (
          alerts.map((alert: any) => {
            const SeverityIcon = getSeverityIcon(alert.severity);
            return (
              <Card
                key={alert.id}
                className={`hover-elevate cursor-pointer transition-all border-l-4 ${getSeverityBgColor(alert.severity)}`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {showResolveButton && (
                      <Checkbox
                        checked={selectedAlerts.includes(alert.id)}
                        onCheckedChange={(checked) => handleSelectAlert(alert.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-alert-${alert.id}`}
                        className="mt-1"
                      />
                    )}
                    <div 
                      className="flex items-start gap-3 flex-1"
                      onClick={() => handleAlertClick(alert.id)}
                    >
                      <div className="p-2 rounded-lg bg-background/80 mt-0.5">
                        <SeverityIcon className={`h-5 w-5 ${getSeverityColor(alert.severity)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-bold">{alert.title}</h3>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(alert.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                          {alert.resolvedAt && (
                            <span className="ml-2 font-medium">
                              • Résolu le {format(new Date(alert.resolvedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {showResolveButton && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveAlertMutation.mutate(alert.id);
                        }}
                        disabled={resolveAlertMutation.isPending}
                        data-testid={`button-resolve-${alert.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Résoudre
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-muted-foreground font-medium">
              {showResolveButton ? "Aucune alerte active" : "Aucune alerte résolue"}
            </p>
            {showResolveButton && (
              <p className="text-xs text-muted-foreground/60 mt-1">Les alertes s'afficheront ici</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header avec gradient */}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Alertes
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Suivez les alertes et notifications importantes
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <Card className="border-l-4 border-l-red-500">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critique</p>
                  <p className="text-2xl font-bold text-red-600">
                    {activeAlerts?.filter((a: any) => a.severity === "critical").length || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500/30" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Attention</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {activeAlerts?.filter((a: any) => a.severity === "warning").length || 0}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-orange-500/30" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Info</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {activeAlerts?.filter((a: any) => a.severity === "info").length || 0}
                  </p>
                </div>
                <Info className="h-8 w-8 text-blue-500/30" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="active" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active-alerts">
            Actives
            {activeAlerts && activeAlerts.length > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved-alerts">
            Résolues
            {resolvedAlerts && resolvedAlerts.length > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                {resolvedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <AlertList alerts={activeAlerts} isLoading={activeLoading} showResolveButton={true} />
        </TabsContent>

        <TabsContent value="resolved">
          <AlertList alerts={resolvedAlerts} isLoading={resolvedLoading} showResolveButton={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
