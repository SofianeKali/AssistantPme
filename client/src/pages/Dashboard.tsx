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
  CheckSquare,
  Circle,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  RotateCcw,
  Zap,
  AlertCircle,
  Inbox,
  Gauge,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUpIcon,
  Info,
  Bell,
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
    queryKey: ["/api/alerts", { limit: 5, resolved: false, selectedEmailAccount }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("limit", "5");
      params.append("resolved", "false");
      if (selectedEmailAccount && selectedEmailAccount !== "all") {
        params.append("emailAccountId", selectedEmailAccount);
      }
      const response = await fetch(`/api/alerts?${params.toString()}`);
      return response.json();
    },
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<any>({
    queryKey: ["/api/tasks", selectedEmailAccount],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmailAccount && selectedEmailAccount !== "all") {
        params.append("emailAccountId", selectedEmailAccount);
      }
      const response = await fetch(`/api/tasks?${params.toString()}`);
      return response.json();
    },
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
    const tasksByStatus = {
      nouveau: (tasks || []).filter((t) => t.status === "nouveau"),
      en_cours: (tasks || []).filter((t) => t.status === "en_cours"),
      termine: (tasks || []).filter((t) => t.status === "termine"),
    };

    return (
      <div key="tasks" className="col-span-full space-y-4">
        {/* Header avec gradient, description et boutons */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <CheckSquare className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-bold text-blue-600">
                  Tâches
                </h3>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Aperçu de vos tâches avec vue complète disponible ci-dessous
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/tasks")}
              data-testid="button-view-all-tasks"
            >
              Voir tout
            </Button>
          </div>
        </div>

        {/* Tasks List Card */}
        <Card className="bg-gradient-to-br from-blue-50/50 to-blue-50/20 dark:from-blue-950/20 dark:to-slate-900/10">
          <CardContent className="pt-6">
            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.slice(0, 5).map((task: any) => {
                  const borderColor = 
                    task.status === "nouveau" ? "border-l-blue-500" :
                    task.status === "en_cours" ? "border-l-orange-500" :
                    "border-l-green-500";
                  
                  return (
                    <Card
                      key={task.id}
                      className={`hover-elevate cursor-pointer transition-all border-l-4 ${borderColor}`}
                      data-testid={`task-${task.id}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-background/80 mt-0.5">
                            {task.status === "nouveau" ? (
                              <Circle className="h-5 w-5 text-blue-500" />
                            ) : task.status === "en_cours" ? (
                              <Clock className="h-5 w-5 text-orange-500" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-sm font-bold">{task.title}</h3>
                              <Badge
                                className={`text-xs ${
                                  task.status === "nouveau"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                                    : task.status === "en_cours"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
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
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                            )}
                            {task.priority && (
                              <Badge variant="secondary" className="text-xs">
                                {task.priority === "urgent" ? "🔴" : task.priority === "haute" ? "🟠" : "⚪"} {task.priority}
                              </Badge>
                            )}
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
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm text-muted-foreground">
                  Aucune tâche
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAlertsSection() {
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

    return (
      <div key="alerts" className="col-span-full space-y-4">
        {/* Header avec gradient, description et boutons */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-red-600" />
                <h3 className="text-lg font-bold text-red-600">
                  Alertes
                </h3>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Aperçu de vos alertes avec vue complète disponible ci-dessous
              </p>
            </div>
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
          </div>
        </div>

        {/* Alerts List Card */}
        <Card className="bg-gradient-to-br from-red-50/50 to-red-50/20 dark:from-red-950/20 dark:to-slate-900/10">
          <CardContent className="pt-6">
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {(() => {
                  // Group alerts by title and calculate totals
                  const groupedAlerts = alerts.reduce((acc: any, alert: any) => {
                    const existingGroup = acc.find((g: any) => g.title === alert.title);
                    if (existingGroup) {
                      existingGroup.totalEmails += alert.emailCount || 0;
                      existingGroup.alerts.push(alert);
                    } else {
                      acc.push({
                        title: alert.title,
                        message: alert.message,
                        severity: alert.severity,
                        totalEmails: alert.emailCount || 0,
                        alerts: [alert],
                        firstAlert: alert,
                      });
                    }
                    return acc;
                  }, []);

                  // Show first 3 grouped alerts
                  return groupedAlerts.slice(0, 3).map((group: any) => {
                    const SeverityIcon = getSeverityIcon(group.severity);
                    const firstAlert = group.firstAlert;
                    return (
                      <Card
                        key={group.title}
                        className={`hover-elevate cursor-pointer transition-all border-l-4 ${getSeverityBgColor(group.severity)}`}
                        onClick={() => {
                          if (group.totalEmails > 0) {
                            setLocation(`/emails?alertId=${firstAlert.id}`);
                          }
                        }}
                        data-testid={`alert-group-${group.title}`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-background/80 mt-0.5">
                              <SeverityIcon className={`h-5 w-5 ${getSeverityColor(group.severity)}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-sm font-bold">{group.title}</h3>
                                {getSeverityBadge(group.severity)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{group.message}</p>
                              <Badge variant="secondary" className="text-xs">
                                {group.totalEmails} email{group.totalEmails > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            {group.totalEmails > 0 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm text-muted-foreground">
                  Aucune alerte active
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderCategoriesSection() {
    return (
      <div key="categories" className="space-y-4 col-span-full">
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

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {uniqueCategories.map((category: any) => {
                    const IconComponent = getIconComponent(category.icon);
                    return (
                      <Card
                        key={category.key}
                        className="hover-elevate cursor-pointer border-l-4 transition-all"
                        style={{
                          borderLeftColor: category.color,
                        }}
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
                          <div className="text-2xl font-semibold" style={{ color: category.color }}>
                            {categoryStats?.[category.key] || 0}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Non traités
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              );
            })()}
      </div>
    );
  }

  function renderEmailEvolutionChart() {
    const data = emailEvolution || [];
    const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
    const average = data.length > 0 ? Math.round(total / data.length) : 0;
    const variation = data.length > 1 
      ? Math.round(((data[data.length - 1]?.count || 0) - (data[0]?.count || 0)) / (data[0]?.count || 1) * 100)
      : 0;

    return (
      <div key="email-evolution" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-bold text-blue-600">
                Évolution des emails traités
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Suivi quotidien des emails traités</p>
          </div>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-50/40 to-slate-50/10 dark:from-blue-950/20 dark:to-slate-900/10">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
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
              <>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.5}
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
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                        cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={COLORS.primary}
                        strokeWidth={2.5}
                        name="Emails traités"
                        dot={{ r: 3, fill: COLORS.primary }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{average}</p>
                    <p className="text-xs text-muted-foreground">Moyenne/jour</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variation >= 0 ? '+' : ''}{variation}%
                    </p>
                    <p className="text-xs text-muted-foreground">Variation</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderEmailDistributionChart() {
    const total = (emailDistribution || []).reduce((sum, item) => sum + (item.value || 0), 0);
    
    return (
      <div key="email-distribution" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-bold text-purple-600">
                Répartition des emails
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Distribution par compte de messagerie</p>
          </div>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50/40 to-slate-50/10 dark:from-purple-950/20 dark:to-slate-900/10">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
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
              <>
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
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 pt-4 border-t">
                  <p className="text-center text-2xl font-bold text-purple-600">{total}</p>
                  <p className="text-center text-xs text-muted-foreground">Emails au total</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAppointmentsChart() {
    const data = appointmentsWeek || [];
    const total = data.reduce((sum, item) => sum + (item.count || 0), 0);
    const maxDay = data.length > 0 ? Math.max(...data.map(item => item.count || 0)) : 0;
    
    return (
      <div key="appointments" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-600">
                Évolution des RDV
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rendez-vous programmés par jour</p>
          </div>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-green-50/40 to-slate-50/10 dark:from-green-950/20 dark:to-slate-900/10">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
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
              <>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.5}
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
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                        cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                      />
                      <Bar
                        dataKey="count"
                        fill={COLORS.chart3}
                        radius={[6, 6, 0, 0]}
                        name="Rendez-vous"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{maxDay}</p>
                    <p className="text-xs text-muted-foreground">Pic du jour</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderCategoryProcessingChart() {
    const data = categoryProcessing || [];
    const avgRate = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + (item.rate || 0), 0) / data.length) : 0;
    
    return (
      <div key="category-processing" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="h-6 w-6 text-orange-600" />
              <h3 className="text-lg font-bold text-orange-600">
                Taux de traitement par catégorie
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Efficacité du traitement par type</p>
          </div>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-orange-50/40 to-slate-50/10 dark:from-orange-950/20 dark:to-slate-900/10">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
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
              <>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.5}
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
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                        cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                      />
                      <Bar
                        dataKey="rate"
                        radius={[6, 6, 0, 0]}
                        name="Taux de traitement (%)"
                      >
                        {data.map(
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
                <div className="mt-6 pt-4 border-t">
                  <p className="text-center text-2xl font-bold text-orange-600">{avgRate}%</p>
                  <p className="text-center text-xs text-muted-foreground">Taux moyen</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderTasksEvolutionChart() {
    const data = tasksEvolution || [];
    const totalNew = data.reduce((sum, item) => sum + (item.nouveau || 0), 0);
    const totalCompleted = data.reduce((sum, item) => sum + (item.termine || 0), 0);
    
    return (
      <div key="tasks-evolution" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-cyan-600" />
              <h3 className="text-lg font-bold text-cyan-600">
                Évolution des tâches
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Progression des tâches par statut</p>
          </div>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-cyan-50/40 to-slate-50/10 dark:from-cyan-950/20 dark:to-slate-900/10">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
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
              <>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.5}
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
                          borderRadius: "8px",
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
                        radius={[6, 6, 0, 0]}
                        name="Terminé"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cyan-600">{totalNew}</p>
                    <p className="text-xs text-muted-foreground">Créées</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{totalCompleted}</p>
                    <p className="text-xs text-muted-foreground">Complétées</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderAlertsEvolutionChart() {
    const data = alertsEvolution || [];
    const totalActive = data.reduce((sum, item) => sum + (item.active || 0), 0);
    const totalResolved = data.reduce((sum, item) => sum + (item.resolved || 0), 0);
    
    return (
      <div key="alerts-evolution" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-600">
                Évolution des alertes
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Alertes actives et résolues</p>
          </div>
        </div>
        <Card className="shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-red-50/40 to-slate-50/10 dark:from-red-950/20 dark:to-slate-900/10">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4">
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
              <>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      margin={{ top: 5, right: 5, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        opacity={0.5}
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
                          borderRadius: "8px",
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
                        radius={[6, 6, 0, 0]}
                        name="Résolues"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{totalActive}</p>
                    <p className="text-xs text-muted-foreground">Actives</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{totalResolved}</p>
                    <p className="text-xs text-muted-foreground">Résolues</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
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
