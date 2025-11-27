import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Zap,
  Info,
  RefreshCw,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Alerts() {
  const { toast } = useToast();
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const resolveAlertsMutation = useMutation({
    mutationFn: async (alertIds: string[]) => {
      for (const id of alertIds) {
        await apiRequest(`/api/alerts/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ resolved: true }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Alertes résolues" });
    },
  });

  const generateAlertsMutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/alerts/generate", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Alertes générées" });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest(`/api/alerts/${alertId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({ title: "Alerte supprimée" });
    },
  });

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
        return "text-red-600";
      case "warning":
        return "text-orange-600";
      default:
        return "text-blue-600";
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
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            Critique
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
            Attention
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            Info
          </Badge>
        );
    }
  };

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (severityFilter === "all") return alerts;
    return alerts.filter((alert: any) => alert.severity === severityFilter);
  }, [alerts, severityFilter]);

  const unresolvedAlerts = useMemo(
    () => filteredAlerts.filter((alert: any) => !alert.resolved),
    [filteredAlerts]
  );

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Alertes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos alertes système et notifications
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateAlertsMutation.mutate()}
            disabled={generateAlertsMutation.isPending}
            data-testid="button-generate-alerts"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                generateAlertsMutation.isPending ? "animate-spin" : ""
              }`}
            />
            Générer
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">Filtre:</label>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-48" data-testid="select-severity">
            <SelectValue placeholder="Filtrer par sévérité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les alertes</SelectItem>
            <SelectItem value="critical">Critiques</SelectItem>
            <SelectItem value="warning">Attention</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        {unresolvedAlerts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const ids = unresolvedAlerts.map((a: any) => a.id);
              resolveAlertsMutation.mutate(ids);
            }}
            disabled={resolveAlertsMutation.isPending}
            data-testid="button-resolve-all"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Tout résoudre
          </Button>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/20 dark:to-slate-900/5">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card className="bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/20 dark:to-slate-900/5">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Aucune alerte</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert: any) => {
            const SeverityIcon = getSeverityIcon(alert.severity);
            return (
              <Card
                key={alert.id}
                className={`bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/20 dark:to-slate-900/5 hover-elevate cursor-pointer transition-all border-l-4 ${getSeverityBgColor(
                  alert.severity
                )}`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-background/80 mt-0.5">
                        <SeverityIcon
                          className={`h-5 w-5 ${getSeverityColor(
                            alert.severity
                          )}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold truncate">
                            {alert.title}
                          </h3>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        {alert.emailCount !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.emailCount} email
                            {alert.emailCount !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!alert.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resolveAlertsMutation.mutate([alert.id])}
                          disabled={resolveAlertsMutation.isPending}
                          data-testid="button-resolve-alert"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlertMutation.mutate(alert.id)}
                        disabled={deleteAlertMutation.isPending}
                        data-testid="button-delete-alert"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
