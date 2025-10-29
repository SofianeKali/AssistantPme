import { useState } from "react";
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
  ChevronLeft,
  ChevronRight,
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
  Label,
} from "recharts";
import { ChartPeriodControls, PeriodType } from "@/components/ChartPeriodControls";
import { getPeriodLabel } from "@/lib/dateUtils";

// Map icon names to Lucide components
const getIconComponent = (iconName: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    Mail: LucideIcons.Mail,
    FileText: LucideIcons.FileText,
    Calendar: LucideIcons.Calendar,
    DollarSign: LucideIcons.DollarSign,
    Package: LucideIcons.Package,
    ShoppingCart: LucideIcons.ShoppingCart,
    Users: LucideIcons.Users,
    Folder: LucideIcons.Folder,
    File: LucideIcons.File,
    Briefcase: LucideIcons.Briefcase,
    Clock: LucideIcons.Clock,
    CheckCircle: LucideIcons.CheckCircle,
    XCircle: LucideIcons.XCircle,
    AlertTriangle: LucideIcons.AlertTriangle,
    Star: LucideIcons.Star,
    Heart: LucideIcons.Heart,
    Home: LucideIcons.Home,
    Phone: LucideIcons.Phone,
    MapPin: LucideIcons.MapPin,
    Send: LucideIcons.Send,
    Inbox: LucideIcons.Inbox,
    Archive: LucideIcons.Archive,
    Tag: LucideIcons.Tag,
    PieChart: LucideIcons.PieChart,
    BarChart: LucideIcons.BarChart,
    TrendingUp: LucideIcons.TrendingUp,
    ShoppingBag: LucideIcons.ShoppingBag,
    CreditCard: LucideIcons.CreditCard,
    Zap: LucideIcons.Zap,
    Gift: LucideIcons.Gift,
    Truck: LucideIcons.Truck,
    Receipt: LucideIcons.Receipt,
    Bell: LucideIcons.Bell,
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
  
  // Period controls for all charts
  const [emailDistributionPeriod, setEmailDistributionPeriod] = useState<PeriodType>('week');
  const [emailDistributionOffset, setEmailDistributionOffset] = useState(0);
  
  const [emailEvolutionPeriod, setEmailEvolutionPeriod] = useState<PeriodType>('week');
  const [emailEvolutionOffset, setEmailEvolutionOffset] = useState(0);
  
  const [categoryProcessingPeriod, setCategoryProcessingPeriod] = useState<PeriodType>('week');
  const [categoryProcessingOffset, setCategoryProcessingOffset] = useState(0);
  
  const [tasksPeriod, setTasksPeriod] = useState<PeriodType>('week');
  const [tasksOffset, setTasksOffset] = useState(0);
  
  const [alertsPeriod, setAlertsPeriod] = useState<PeriodType>('week');
  const [alertsOffset, setAlertsOffset] = useState(0);
  
  const [appointmentsPeriod, setAppointmentsPeriod] = useState<PeriodType>('week');
  const [appointmentsOffset, setAppointmentsOffset] = useState(0);

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

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
  
  // All chart queries with period controls
  const { data: emailDistribution, isLoading: emailDistributionLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/email-distribution", emailDistributionPeriod, emailDistributionOffset],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/email-distribution?periodType=${emailDistributionPeriod}&offset=${emailDistributionOffset}`);
      return response.json();
    },
  });

  const { data: emailEvolution, isLoading: emailEvolutionLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/email-evolution", emailEvolutionPeriod, emailEvolutionOffset],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/email-evolution?periodType=${emailEvolutionPeriod}&offset=${emailEvolutionOffset}`);
      return response.json();
    },
  });

  const { data: categoryProcessing, isLoading: categoryProcessingLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/category-processing", categoryProcessingPeriod, categoryProcessingOffset],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/category-processing?periodType=${categoryProcessingPeriod}&offset=${categoryProcessingOffset}`);
      return response.json();
    },
  });

  const { data: tasksEvolution, isLoading: tasksEvolutionLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/tasks-evolution", tasksPeriod, tasksOffset],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/tasks-evolution?periodType=${tasksPeriod}&offset=${tasksOffset}`);
      return response.json();
    },
  });

  const { data: alertsEvolution, isLoading: alertsEvolutionLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/alerts-evolution", alertsPeriod, alertsOffset],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/alerts-evolution?periodType=${alertsPeriod}&offset=${alertsOffset}`);
      return response.json();
    },
  });

  const { data: appointmentsWeek, isLoading: appointmentsWeekLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/appointments-week", appointmentsPeriod, appointmentsOffset],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/appointments-week?periodType=${appointmentsPeriod}&offset=${appointmentsOffset}`);
      return response.json();
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
                        variant={
                          task.status === "nouveau" ? "secondary" : "default"
                        }
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
                    onClick={() => {
                      if (alert.emailCount > 0) {
                        setLocation(`/emails?alertId=${alert.id}`);
                      }
                    }}
                    className={`flex items-start gap-3 p-3 rounded-md border border-border hover-elevate ${
                      alert.emailCount > 0 ? "cursor-pointer active-elevate-2" : ""
                    }`}
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
                      <div className="text-sm font-medium flex items-center gap-2">
                        {alert.title}
                        {alert.emailCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {alert.emailCount} email{alert.emailCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
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
                    {alert.emailCount > 0 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
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


      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des emails traités */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Évolution des emails traités</CardTitle>
            <ChartPeriodControls
              periodType={emailEvolutionPeriod}
              onPeriodTypeChange={(type) => setEmailEvolutionPeriod(type)}
              offset={emailEvolutionOffset}
              onOffsetChange={setEmailEvolutionOffset}
              periodLabel={getPeriodLabel(emailEvolutionPeriod, emailEvolutionOffset)}
              testIdPrefix="email-evolution"
            />
          </CardHeader>
          <CardContent>
            {emailEvolutionLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={emailEvolution || []}>
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
            )}
          </CardContent>
        </Card>

        {/* Répartition des emails reçus */}
        <Card data-testid="card-email-distribution">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Répartition des emails reçus</CardTitle>
            <ChartPeriodControls
              periodType={emailDistributionPeriod}
              onPeriodTypeChange={(type) => setEmailDistributionPeriod(type)}
              offset={emailDistributionOffset}
              onOffsetChange={setEmailDistributionOffset}
              periodLabel={getPeriodLabel(emailDistributionPeriod, emailDistributionOffset)}
              testIdPrefix="email-distribution"
            />
          </CardHeader>
          <CardContent>
            {emailDistributionLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={emailDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => `${entry.name} (${entry.value})`}
                    labelLine={true}
                  >
                    {emailDistribution?.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
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
            )}
          </CardContent>
        </Card>

        {/* Évolution des RDV */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Évolution des RDV</CardTitle>
            <ChartPeriodControls
              periodType={appointmentsPeriod}
              onPeriodTypeChange={(type) => setAppointmentsPeriod(type)}
              offset={appointmentsOffset}
              onOffsetChange={setAppointmentsOffset}
              periodLabel={getPeriodLabel(appointmentsPeriod, appointmentsOffset)}
              testIdPrefix="appointments"
            />
          </CardHeader>
          <CardContent>
            {appointmentsWeekLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={appointmentsWeek || []}>
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
                  <Bar
                    dataKey="count"
                    fill={COLORS.chart2}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Taux de traitement par catégorie */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Taux de traitement par catégorie</CardTitle>
            <ChartPeriodControls
              periodType={categoryProcessingPeriod}
              onPeriodTypeChange={(type) => setCategoryProcessingPeriod(type)}
              offset={categoryProcessingOffset}
              onOffsetChange={setCategoryProcessingOffset}
              periodLabel={getPeriodLabel(categoryProcessingPeriod, categoryProcessingOffset)}
              testIdPrefix="category-processing"
            />
          </CardHeader>
          <CardContent>
            {categoryProcessingLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryProcessing || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    formatter={(value: any) => [`${value}%`, "Taux"]}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {categoryProcessing?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS.chart3} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Évolution des tâches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Évolution des tâches</CardTitle>
            <ChartPeriodControls
              periodType={tasksPeriod}
              onPeriodTypeChange={(type) => setTasksPeriod(type)}
              offset={tasksOffset}
              onOffsetChange={setTasksOffset}
              periodLabel={getPeriodLabel(tasksPeriod, tasksOffset)}
              testIdPrefix="tasks"
            />
          </CardHeader>
          <CardContent>
            {tasksEvolutionLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tasksEvolution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                  <Legend />
                  <Bar
                    dataKey="nouveau"
                    stackId="a"
                    fill={COLORS.chart3}
                    radius={[0, 0, 0, 0]}
                    name="Nouveau"
                  />
                  <Bar
                    dataKey="enCours"
                    stackId="a"
                    fill={COLORS.primary}
                    radius={[0, 0, 0, 0]}
                    name="En cours"
                  />
                  <Bar
                    dataKey="termine"
                    stackId="a"
                    fill={COLORS.chart1}
                    radius={[4, 4, 0, 0]}
                    name="Terminé"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Evolution des alertes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Evolution des alertes</CardTitle>
            <ChartPeriodControls
              periodType={alertsPeriod}
              onPeriodTypeChange={(type) => setAlertsPeriod(type)}
              offset={alertsOffset}
              onOffsetChange={setAlertsOffset}
              periodLabel={getPeriodLabel(alertsPeriod, alertsOffset)}
              testIdPrefix="alerts"
            />
          </CardHeader>
          <CardContent>
            {alertsEvolutionLoading ? (
              <Skeleton className="h-[250px]" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={alertsEvolution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
                  <Legend />
                  <Bar
                    dataKey="active"
                    stackId="a"
                    fill={COLORS.chart3}
                    radius={[0, 0, 0, 0]}
                    name="Actives"
                  />
                  <Bar
                    dataKey="resolved"
                    stackId="a"
                    fill={COLORS.chart1}
                    radius={[4, 4, 0, 0]}
                    name="Résolues"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
