import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

export default function Alerts() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: activeAlerts, isLoading: activeLoading } = useQuery({
    queryKey: ["/api/alerts", { resolved: false }],
  });

  const { data: resolvedAlerts, isLoading: resolvedLoading } = useQuery({
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

  const AlertList = ({ alerts, isLoading, showResolveButton = true }: any) => (
    <div className="space-y-3">
      {isLoading ? (
        [...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)
      ) : alerts && alerts.length > 0 ? (
        alerts.map((alert: any) => (
          <Card
            key={alert.id}
            className={`p-4 cursor-pointer hover-elevate ${
              alert.severity === "critical"
                ? "border-l-4 border-l-destructive"
                : alert.severity === "warning"
                  ? "border-l-4 border-l-chart-3"
                  : ""
            }`}
            data-testid={`alert-${alert.id}`}
            onClick={() => handleAlertClick(alert.id)}
          >
            <div className="flex items-start gap-4">
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Alertes</h1>
        <p className="text-sm text-muted-foreground">
          Suivez les alertes et notifications importantes
        </p>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
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
