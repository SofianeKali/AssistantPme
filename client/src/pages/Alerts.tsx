import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, CheckCircle, CheckCheck } from "lucide-react";
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive";
      case "warning":
        return "text-chart-3";
      default:
        return "text-primary";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critique</Badge>;
      case "warning":
        return <Badge className="bg-chart-3 text-primary-foreground">Attention</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  const handleAlertClick = (alertId: string) => {
    setLocation(`/emails?alertId=${alertId}`);
  };

  const AlertList = ({ alerts, isLoading, showResolveButton = true }: any) => {
    const allSelected = alerts?.length > 0 && alerts.every((a: any) => selectedAlerts.includes(a.id));
    const someSelected = alerts?.some((a: any) => selectedAlerts.includes(a.id));

    return (
      <div className="space-y-3">
        {/* Bulk actions bar */}
        {showResolveButton && alerts && alerts.length > 0 && (
          <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-md">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => handleSelectAll(alerts, checked as boolean)}
                data-testid="checkbox-select-all"
              />
              <span className="text-sm text-muted-foreground">
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
          alerts.map((alert: any) => (
            <Card
              key={alert.id}
              className={`p-4 hover-elevate ${
                alert.severity === "critical"
                  ? "border-l-4 border-l-destructive"
                  : alert.severity === "warning"
                    ? "border-l-4 border-l-chart-3"
                    : ""
              }`}
              data-testid={`alert-${alert.id}`}
            >
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
                  className="flex items-start gap-4 flex-1 cursor-pointer"
                  onClick={() => handleAlertClick(alert.id)}
                >
                  <AlertTriangle className={`h-5 w-5 mt-1 ${getSeverityColor(alert.severity)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold">{alert.title}</h3>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(alert.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                      {alert.resolvedAt && (
                        <span className="ml-2">
                          • Résolu le {format(new Date(alert.resolvedAt), "dd MMMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      )}
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
          ))
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {showResolveButton ? "Aucune alerte active" : "Aucune alerte résolue"}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Alertes</h1>
        <p className="text-sm text-muted-foreground">
          Suivez les alertes et notifications importantes
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active-alerts">
            Actives
            {activeAlerts && activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved-alerts">Résolues</TabsTrigger>
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
