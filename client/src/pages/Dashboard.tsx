import { useState, useEffect } from "react";
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
  GripVertical,
  RotateCcw,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ChartPeriodControls,
  PeriodType,
} from "@/components/ChartPeriodControls";
import { getPeriodLabel } from "@/lib/dateUtils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// Default order of dashboard components
const DEFAULT_LAYOUT = [
  "tasks",
  "alerts",
  "categories",
  "tasks-evolution",
  "email-evolution",
  "email-distribution",
  "category-processing",
  "alerts-evolution",
  "appointments",
];

// Sortable wrapper component
function SortableItem({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${className || ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-background/80 rounded border border-border"
        data-testid={`drag-handle-${id}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Email account filter
  const [selectedEmailAccount, setSelectedEmailAccount] =
    useState<string>("all");

  // Period controls for all charts
  const [emailDistributionPeriod, setEmailDistributionPeriod] =
    useState<PeriodType>("week");
  const [emailDistributionOffset, setEmailDistributionOffset] = useState(0);

  const [emailEvolutionPeriod, setEmailEvolutionPeriod] =
    useState<PeriodType>("week");
  const [emailEvolutionOffset, setEmailEvolutionOffset] = useState(0);

  const [categoryProcessingPeriod, setCategoryProcessingPeriod] =
    useState<PeriodType>("week");
  const [categoryProcessingOffset, setCategoryProcessingOffset] = useState(0);

  const [tasksPeriod, setTasksPeriod] = useState<PeriodType>("week");
  const [tasksOffset, setTasksOffset] = useState(0);

  const [alertsPeriod, setAlertsPeriod] = useState<PeriodType>("week");
  const [alertsOffset, setAlertsOffset] = useState(0);

  const [appointmentsPeriod, setAppointmentsPeriod] =
    useState<PeriodType>("week");
  const [appointmentsOffset, setAppointmentsOffset] = useState(0);

  // Fetch email accounts for filter
  const { data: emailAccounts } = useQuery<any[]>({
    queryKey: ["/api/email-accounts"],
  });

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats", selectedEmailAccount],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmailAccount && selectedEmailAccount !== "all") {
        params.append("emailAccountId", selectedEmailAccount);
      }
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      return response.json();
    },
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
  const { data: emailDistribution, isLoading: emailDistributionLoading } =
    useQuery<any>({
      queryKey: [
        "/api/dashboard/email-distribution",
        emailDistributionPeriod,
        emailDistributionOffset,
        selectedEmailAccount,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append("periodType", emailDistributionPeriod);
        params.append("offset", emailDistributionOffset.toString());
        if (selectedEmailAccount && selectedEmailAccount !== "all") {
          params.append("emailAccountId", selectedEmailAccount);
        }
        const response = await fetch(
          `/api/dashboard/email-distribution?${params.toString()}`,
        );
        return response.json();
      },
    });

  const { data: emailEvolution, isLoading: emailEvolutionLoading } =
    useQuery<any>({
      queryKey: [
        "/api/dashboard/email-evolution",
        emailEvolutionPeriod,
        emailEvolutionOffset,
        selectedEmailAccount,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append("periodType", emailEvolutionPeriod);
        params.append("offset", emailEvolutionOffset.toString());
        if (selectedEmailAccount && selectedEmailAccount !== "all") {
          params.append("emailAccountId", selectedEmailAccount);
        }
        const response = await fetch(
          `/api/dashboard/email-evolution?${params.toString()}`,
        );
        return response.json();
      },
    });

  const { data: categoryProcessing, isLoading: categoryProcessingLoading } =
    useQuery<any>({
      queryKey: [
        "/api/dashboard/category-processing",
        categoryProcessingPeriod,
        categoryProcessingOffset,
        selectedEmailAccount,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append("periodType", categoryProcessingPeriod);
        params.append("offset", categoryProcessingOffset.toString());
        if (selectedEmailAccount && selectedEmailAccount !== "all") {
          params.append("emailAccountId", selectedEmailAccount);
        }
        const response = await fetch(
          `/api/dashboard/category-processing?${params.toString()}`,
        );
        return response.json();
      },
    });

  const { data: tasksEvolution, isLoading: tasksEvolutionLoading } =
    useQuery<any>({
      queryKey: [
        "/api/dashboard/tasks-evolution",
        tasksPeriod,
        tasksOffset,
        selectedEmailAccount,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append("periodType", tasksPeriod);
        params.append("offset", tasksOffset.toString());
        if (selectedEmailAccount && selectedEmailAccount !== "all") {
          params.append("emailAccountId", selectedEmailAccount);
        }
        const response = await fetch(
          `/api/dashboard/tasks-evolution?${params.toString()}`,
        );
        return response.json();
      },
    });

  const { data: alertsEvolution, isLoading: alertsEvolutionLoading } =
    useQuery<any>({
      queryKey: [
        "/api/dashboard/alerts-evolution",
        alertsPeriod,
        alertsOffset,
        selectedEmailAccount,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append("periodType", alertsPeriod);
        params.append("offset", alertsOffset.toString());
        if (selectedEmailAccount && selectedEmailAccount !== "all") {
          params.append("emailAccountId", selectedEmailAccount);
        }
        const response = await fetch(
          `/api/dashboard/alerts-evolution?${params.toString()}`,
        );
        return response.json();
      },
    });

  const { data: appointmentsWeek, isLoading: appointmentsWeekLoading } =
    useQuery<any>({
      queryKey: [
        "/api/dashboard/appointments-week",
        appointmentsPeriod,
        appointmentsOffset,
        selectedEmailAccount,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append("periodType", appointmentsPeriod);
        params.append("offset", appointmentsOffset.toString());
        if (selectedEmailAccount && selectedEmailAccount !== "all") {
          params.append("emailAccountId", selectedEmailAccount);
        }
        const response = await fetch(
          `/api/dashboard/appointments-week?${params.toString()}`,
        );
        return response.json();
      },
    });

  // Queries for unprocessed emails by category
  const { data: categoryStats, isLoading: categoryStatsLoading } = useQuery<
    Record<string, number>
  >({
    queryKey: ["/api/emails/stats/by-category", selectedEmailAccount],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmailAccount && selectedEmailAccount !== "all") {
        params.append("emailAccountId", selectedEmailAccount);
      }
      const response = await fetch(
        `/api/emails/stats/by-category?${params.toString()}`,
      );
      return response.json();
    },
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<any>({
    queryKey: ["/api/email-categories"],
  });

  // Dashboard layout state and queries
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);

  const { data: savedLayout } = useQuery<any>({
    queryKey: ["/api/dashboard/layout"],
  });

  // Load saved layout on mount and merge with DEFAULT_LAYOUT
  useEffect(() => {
    if (savedLayout?.layout && Array.isArray(savedLayout.layout)) {
      if (savedLayout.layout.length === 0) {
        // New user with no saved layout - use default
        setLayout(DEFAULT_LAYOUT);
      } else {
        // Existing user with saved layout - merge with defaults
        // Filter out invalid/deprecated sections from saved layout
        const validSections = savedLayout.layout.filter((id: string) =>
          DEFAULT_LAYOUT.includes(id),
        );

        // Add any new sections from DEFAULT_LAYOUT that aren't in saved layout
        const newSections = DEFAULT_LAYOUT.filter(
          (id: string) => !savedLayout.layout.includes(id),
        );

        // Merge: existing sections in saved order + new sections at the end
        const mergedLayout = [...validSections, ...newSections];
        setLayout(mergedLayout);
      }
    }
  }, [savedLayout]);

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (newLayout: string[]) => {
      const res = await apiRequest("POST", "/api/dashboard/layout", {
        layout: newLayout,
      });
      return await res.json();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'ordre",
        variant: "destructive",
      });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newLayout = arrayMove(items, oldIndex, newIndex);

        // Save to backend
        saveLayoutMutation.mutate(newLayout);

        return newLayout;
      });
    }
  };

  // Reset layout to default
  const resetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    saveLayoutMutation.mutate(DEFAULT_LAYOUT);
    toast({
      title: "Ordre réinitialisé",
      description: "L'ordre par défaut a été restauré",
    });
  };

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

  // Render functions for each dashboard section
  const renderSection = (sectionId: string) => {
    const sections: Record<string, JSX.Element> = {
      tasks: renderTasksSection(),
      alerts: renderAlertsSection(),
      categories: renderCategoriesSection(),
      "tasks-evolution": renderTasksEvolutionChart(),
      "email-evolution": renderEmailEvolutionChart(),
      "email-distribution": renderEmailDistributionChart(),
      "category-processing": renderCategoryProcessingChart(),
      "alerts-evolution": renderAlertsEvolutionChart(),
      appointments: renderAppointmentsChart(),
    };

    return sections[sectionId] || null;
  };

  function renderTasksSection() {
    return (
      <Card key="tasks">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            Tâches en cours
          </CardTitle>
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
                        task.status === "nouveau"
                          ? "secondary"
                          : task.status === "termine"
                            ? "outline"
                            : "default"
                      }
                      className={`text-xs mt-2 ${
                        task.status === "termine"
                          ? "bg-chart-2/20 text-chart-2 border-chart-2"
                          : ""
                      }`}
                      data-testid={`badge-task-status-${task.id}`}
                    >
                      {task.status === "nouveau"
                        ? "Nouveau"
                        : task.status === "termine"
                          ? "Terminé"
                          : "En cours"}
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
                        data-testid={`button-start-task-${task.id}`}
                      >
                        <Clock className="h-3 w-3" />
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
                        data-testid={`button-complete-task-${task.id}`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
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
    );
  }

  function renderAlertsSection() {
    return (
      <Card key="alerts">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            Alertes actives
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateAlertsMutation.mutate()}
              disabled={generateAlertsMutation.isPending}
              data-testid="button-generate-alerts"
            >
              <RefreshCw
                className={`h-4 w-4 ${generateAlertsMutation.isPending ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/alerts")}
              data-testid="button-view-all-alerts"
            >
              Voir tout
            </Button>
          </div>
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
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-3 p-3 rounded-md border border-border hover-elevate ${alert.emailCount > 0 ? "cursor-pointer" : ""}`}
                  onClick={() => {
                    if (alert.emailCount > 0) {
                      setLocation(`/emails?alertId=${alert.id}`);
                    }
                  }}
                  data-testid={`alert-${alert.id}`}
                >
                  <AlertTriangle
                    className={
                      alert.severity === "critical"
                        ? "h-5 w-5 text-destructive"
                        : alert.severity === "warning"
                          ? "h-5 w-5 text-chart-3"
                          : "h-5 w-5 text-muted-foreground"
                    }
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
    );
  }

  function renderCategoriesSection() {
    return (
      <div key="categories">
        <h2 className="text-xl font-semibold mb-4">
          Emails non traités par catégorie
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoryStatsLoading || categoriesLoading
            ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)
            : categories &&
              (() => {
                const uniqueCategories = categories.reduce(
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
    );
  }

  function renderEmailEvolutionChart() {
    return (
      <Card key="email-evolution">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle>
            Évolution des emails traités
          </CardTitle>
          <ChartPeriodControls
            periodType={emailEvolutionPeriod}
            onPeriodTypeChange={(type) => setEmailEvolutionPeriod(type)}
            offset={emailEvolutionOffset}
            onOffsetChange={setEmailEvolutionOffset}
            periodLabel={getPeriodLabel(
              emailEvolutionPeriod,
              emailEvolutionOffset,
            )}
            testIdPrefix="email-evolution"
          />
        </CardHeader>
        <CardContent>
          {emailEvolutionLoading ? (
            <Skeleton className="h-[200px] sm:h-[250px]" />
          ) : (
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={emailEvolution || []}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Emails traités"
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderEmailDistributionChart() {
    return (
      <Card key="email-distribution">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <CardTitle>
            Répartition des emails reçus
          </CardTitle>
          <ChartPeriodControls
            periodType={emailDistributionPeriod}
            onPeriodTypeChange={(type) => setEmailDistributionPeriod(type)}
            offset={emailDistributionOffset}
            onOffsetChange={setEmailDistributionOffset}
            periodLabel={getPeriodLabel(
              emailDistributionPeriod,
              emailDistributionOffset,
            )}
            testIdPrefix="email-distribution"
          />
        </CardHeader>
        <CardContent>
          {emailDistributionLoading ? (
            <Skeleton className="h-[200px] sm:h-[250px]" />
          ) : (
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emailDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(emailDistribution || []).map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.color ||
                            CHART_COLORS[index % CHART_COLORS.length]
                          }
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderAppointmentsChart() {
    return (
      <Card key="appointments">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle>
            Évolution des RDV
          </CardTitle>
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
            <Skeleton className="h-[200px] sm:h-[250px]" />
          ) : (
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={appointmentsWeek || []}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill={COLORS.chart3}
                    radius={[4, 4, 0, 0]}
                    name="Rendez-vous"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderCategoryProcessingChart() {
    return (
      <Card key="category-processing">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle>
            Taux de traitement par catégorie
          </CardTitle>
          <ChartPeriodControls
            periodType={categoryProcessingPeriod}
            onPeriodTypeChange={(type) => setCategoryProcessingPeriod(type)}
            offset={categoryProcessingOffset}
            onOffsetChange={setCategoryProcessingOffset}
            periodLabel={getPeriodLabel(
              categoryProcessingPeriod,
              categoryProcessingOffset,
            )}
            testIdPrefix="category-processing"
          />
        </CardHeader>
        <CardContent>
          {categoryProcessingLoading ? (
            <Skeleton className="h-[200px] sm:h-[250px]" />
          ) : (
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryProcessing || []}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                  />
                  <Bar
                    dataKey="rate"
                    radius={[4, 4, 0, 0]}
                    name="Taux de traitement (%)"
                  >
                    {(categoryProcessing || []).map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || COLORS.chart1}
                        />
                      ),
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderTasksEvolutionChart() {
    return (
      <Card key="tasks-evolution">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle>
            Évolution des tâches
          </CardTitle>
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
            <Skeleton className="h-[200px] sm:h-[250px]" />
          ) : (
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tasksEvolution || []}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "13px" }}
                    iconType="circle"
                  />
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
                    fill={COLORS.chart2}
                    radius={[4, 4, 0, 0]}
                    name="Terminé"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  function renderAlertsEvolutionChart() {
    return (
      <Card key="alerts-evolution">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
          <CardTitle>
            Evolution des alertes
          </CardTitle>
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
            <Skeleton className="h-[200px] sm:h-[250px]" />
          ) : (
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={alertsEvolution || []}
                  margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tick={{ fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                    cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "13px" }}
                    iconType="circle"
                  />
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
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Mon cockpit
            </h1>
            <p className="text-sm text-muted-foreground">
              Vue d'ensemble de votre activité administrative
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetLayout}
            data-testid="button-reset-layout"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser l'ordre
          </Button>
        </div>

        {/* Email Account Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-foreground">
            Compte email :
          </label>
          <Select
            value={selectedEmailAccount}
            onValueChange={setSelectedEmailAccount}
          >
            <SelectTrigger className="w-72" data-testid="select-email-account">
              <SelectValue placeholder="Sélectionner un compte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les comptes</SelectItem>
              {emailAccounts?.map((account: any) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{account.email}</span>
                    {!account.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Inactif
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Draggable sections */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {layout.map((sectionId) => (
              <SortableItem
                key={sectionId}
                id={sectionId}
                className={sectionId === "categories" ? "lg:col-span-2" : ""}
              >
                {renderSection(sectionId)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
