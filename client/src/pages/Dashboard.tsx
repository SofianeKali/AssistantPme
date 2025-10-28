import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  FileText,
  Calendar,
  Mail,
  TrendingUp,
  TrendingDown,
  LucideIcon,
  RefreshCw,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Map icon names to Lucide components
const getIconComponent = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    FileText: LucideIcons.FileText,
    Calendar: LucideIcons.Calendar,
    Mail: LucideIcons.Mail,
    CreditCard: LucideIcons.CreditCard,
    Receipt: LucideIcons.Receipt,
    Phone: LucideIcons.Phone,
    MessageSquare: LucideIcons.MessageSquare,
    Inbox: LucideIcons.Inbox,
    Send: LucideIcons.Send,
    Archive: LucideIcons.Archive,
    AlertCircle: LucideIcons.AlertCircle,
  };

  return iconMap[iconName] || LucideIcons.Mail;
};

const COLORS = {
  primary: "hsl(var(--primary))",
  chart1: "hsl(var(--chart-1))",
  chart2: "hsl(var(--chart-2))",
  chart3: "hsl(var(--chart-3))",
  chart4: "hsl(var(--chart-4))",
  chart5: "hsl(var(--chart-5))",
};

const CHART_COLORS = [
  COLORS.chart1,
  COLORS.chart2,
  COLORS.chart3,
  COLORS.chart4,
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: charts, isLoading: chartsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/charts"],
  });

  const { data: categoryStats, isLoading: categoryStatsLoading } =
    useQuery<any>({
      queryKey: ["/api/emails/stats/by-category"],
    });

  const { data: emailCategories, isLoading: categoriesLoading } = useQuery<any>(
    {
      queryKey: ["/api/email-categories"],
    },
  );

  const { data: alerts, isLoading: alertsLoading } = useQuery<any>({
    queryKey: ["/api/alerts", { limit: 5, resolved: false }],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<any>({
    queryKey: ["/api/tasks"],
    select: (data) => {
      // Filter only "nouveau" and "en_cours" tasks
      return (
        data?.filter(
          (task: any) =>
            task.status === "nouveau" || task.status === "en_cours",
        ) || []
      );
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}/status`, {
        status,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la tâche a été modifié",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    },
  });

  const generateAlertsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/alerts/generate");
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      if (data.created > 0) {
        toast({
          title: "Alertes générées",
          description: `${data.created} nouvelle(s) alerte(s) créée(s)`,
        });
      } else {
        toast({
          title: "Vérification terminée",
          description: "Aucune nouvelle alerte",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer les alertes",
        variant: "destructive",
      });
    },
  });

  if (isLoading || chartsLoading) {
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
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground">
          Vue d'ensemble de votre activité administrative
        </p>
      </div>

      {/* Tasks and Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl">Tâches en cours</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/tasks")}
              data-testid="button-view-all-tasks"
            >
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-md border border-border hover-elevate"
                    data-testid={`task-${task.id}`}
                  >
                    {task.status === "nouveau" ? (
                      <Circle className="h-5 w-5 mt-0.5 text-chart-3" />
                    ) : (
                      <Clock className="h-5 w-5 mt-0.5 text-primary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </div>
                      )}
                      <Badge
                        variant={task.status === "nouveau" ? "secondary" : "default"}
                        className="text-xs mt-2"
                      >
                        {task.status === "nouveau" ? "Nouveau" : "En cours"}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      {task.status === "nouveau" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateTaskStatusMutation.mutate({
                              taskId: task.id,
                              status: "en_cours",
                            })
                          }
                          disabled={updateTaskStatusMutation.isPending}
                          data-testid={`button-start-task-${task.id}`}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                      {task.status === "en_cours" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateTaskStatusMutation.mutate({
                              taskId: task.id,
                              status: "termine",
                            })
                          }
                          disabled={updateTaskStatusMutation.isPending}
                          data-testid={`button-complete-task-${task.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Aucune tâche en cours
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl">Alertes récentes</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateAlertsMutation.mutate()}
              disabled={generateAlertsMutation.isPending}
              data-testid="button-generate-alerts"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${generateAlertsMutation.isPending ? "animate-spin" : ""}`}
              />
              Vérifier
            </Button>
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
                      <div className="text-xs text-muted-foreground mt-1">
                        {alert.message}
                      </div>
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

      {/* Email Categories */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Emails non traités par catégorie
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryStatsLoading || categoriesLoading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
            : emailCategories &&
              (() => {
                const uniqueCategories = emailCategories.reduce(
                  (acc: any[], category: any) => {
                    const existing = acc.find((c) => c.key === category.key);
                    if (!existing) {
                      acc.push(category);
                    } else if (category.isSystem && !existing.isSystem) {
                      const index = acc.indexOf(existing);
                      acc[index] = category;
                    }
                    return acc;
                  },
                  [],
                );

                return uniqueCategories.map((category: any) => {
                  const IconComponent = getIconComponent(category.icon);
                  return (
                    <Card
                      key={category.key}
                      className="hover-elevate cursor-pointer"
                      onClick={() =>
                        setLocation(
                          `/emails?category=${category.key}&status=nouveau`,
                        )
                      }
                      data-testid={`category-block-${category.key}`}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {category.label}
                        </CardTitle>
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center"
                          style={{
                            backgroundColor: category.color + "20",
                            color: category.color,
                          }}
                        >
                          <IconComponent className="h-4 w-4" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold">
                          {categoryStats?.[category.key] || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Non traités
                        </p>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des emails traités */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des emails traités</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={charts?.emailEvolution || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: COLORS.primary }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des emails reçus */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des emails reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={charts?.emailDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry) => `${entry.name}`}
                >
                  {charts?.emailDistribution?.map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ),
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RDV planifiés par semaine */}
        <Card>
          <CardHeader>
            <CardTitle>RDV planifiés par semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts?.appointmentsByWeek || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="week"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={COLORS.chart2}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taux de traitement par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle>Taux de traitement par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={charts?.categoryProcessing || []}
                layout="vertical"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                  formatter={(value: any) => [`${value}%`, "Taux"]}
                />
                <Bar
                  dataKey="rate"
                  fill={COLORS.chart3}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel de traitement */}
        <Card>
          <CardHeader>
            <CardTitle>Traitement des emails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {charts?.emailFunnel?.map((stage: any, index: number) => {
              const maxCount = charts.emailFunnel[0]?.count || 1;
              const percentage = Math.round((stage.count / maxCount) * 100);

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{stage.name}</span>
                    <span className="font-semibold">{stage.count}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
