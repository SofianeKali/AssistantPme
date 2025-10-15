import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText, Calendar, Mail, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
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

  const statCards = [
    {
      title: "Devis sans réponse",
      value: stats?.quotesNoResponse || 0,
      icon: FileText,
      severity: "warning",
      testId: "stat-quotes-no-response",
    },
    {
      title: "Factures",
      value: stats?.unpaidInvoices || 0,
      icon: AlertTriangle,
      severity: "critical",
      testId: "stat-unpaid-invoices",
    },
    {
      title: "RDV aujourd'hui",
      value: stats?.appointmentsToday || 0,
      icon: Calendar,
      severity: "info",
      testId: "stat-appointments-today",
    },
    {
      title: "Emails non traités",
      value: stats?.unprocessedEmails || 0,
      icon: Mail,
      severity: "info",
      testId: "stat-unprocessed-emails",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble de votre activité administrative
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className={`hover-elevate ${
              stat.severity === "critical"
                ? "border-l-4 border-l-destructive"
                : stat.severity === "warning"
                  ? "border-l-4 border-l-chart-3"
                  : ""
            }`}
            data-testid={stat.testId}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
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
