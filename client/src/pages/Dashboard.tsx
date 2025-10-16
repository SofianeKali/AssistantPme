import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText, Calendar, Mail, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: categoryStats, isLoading: categoryStatsLoading } = useQuery<any>({
    queryKey: ["/api/emails/stats/by-category"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery<any>({
    queryKey: ["/api/alerts", { limit: 5, resolved: false }],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble de votre activité administrative
        </p>
      </div>

      {/* Email Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Emails par catégorie</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryStatsLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
          ) : (
            [
              { key: 'devis', label: 'Devis', icon: FileText, color: 'text-chart-1', bgColor: 'bg-chart-1/10', borderColor: 'border-chart-1/20' },
              { key: 'facture', label: 'Factures', icon: FileText, color: 'text-chart-3', bgColor: 'bg-chart-3/10', borderColor: 'border-chart-3/20' },
              { key: 'rdv', label: 'Rendez-vous', icon: Calendar, color: 'text-chart-2', bgColor: 'bg-chart-2/10', borderColor: 'border-chart-2/20' },
              { key: 'autre', label: 'Autres', icon: Mail, color: 'text-muted-foreground', bgColor: 'bg-muted', borderColor: 'border-border' },
            ].map((category) => (
              <Card
                key={category.key}
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation(`/emails?category=${category.key}`)}
                data-testid={`category-${category.key}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{category.label}</CardTitle>
                  <category.icon className={`h-4 w-4 ${category.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{categoryStats?.[category.key] || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cliquez pour filtrer
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Récapitulatif mensuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SummaryItem
              label="Emails traités"
              value={stats?.monthlyEmailsProcessed || 0}
              trend="up"
              change="+12%"
            />
            <SummaryItem
              label="RDV planifiés"
              value={stats?.monthlyAppointments || 0}
              trend="up"
              change="+8%"
            />
            <SummaryItem
              label="Documents extraits"
              value={stats?.monthlyDocuments || 0}
              trend="up"
              change="+15%"
            />
            <SummaryItem
              label="Alertes actives"
              value={stats?.activeAlerts || 0}
              trend="down"
              change="-5%"
            />
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Alertes récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert: any) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover-elevate"
                    data-testid={`alert-${alert.id}`}
                  >
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 ${
                        alert.severity === "critical"
                          ? "text-destructive"
                          : alert.severity === "warning"
                            ? "text-chart-3"
                            : "text-primary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{alert.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{alert.message}</div>
                    </div>
                    <Badge
                      variant={
                        alert.severity === "critical"
                          ? "destructive"
                          : alert.severity === "warning"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {alert.severity === "critical"
                        ? "Critique"
                        : alert.severity === "warning"
                          ? "Attention"
                          : "Info"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucune alerte active
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  trend,
  change,
}: {
  label: string;
  value: number;
  trend: "up" | "down";
  change: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold">{value}</span>
        <div
          className={`flex items-center gap-1 text-xs ${
            trend === "up" ? "text-chart-2" : "text-chart-3"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
}
