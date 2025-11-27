import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Trash2,
  Mail,
  User as UserIcon,
  Zap,
  AlertCircle,
  TrendingUp,
  Target,
} from "lucide-react";
import type { Task, User } from "@shared/schema";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

export default function Tasks() {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/tasks/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Statut de la tâche mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({
      id,
      assignedToId,
    }: {
      id: string;
      assignedToId: string | null;
    }) => {
      await apiRequest("PATCH", `/api/tasks/${id}/assign`, { assignedToId });
    },
    onSuccess: () => {
      toast({ title: "Assignation mise à jour" });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Tâche supprimée" });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setSelectedTask(null);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;
    const task = tasks.find((t) => t.id === taskId);

    if (task && task.status !== newStatus) {
      updateStatusMutation.mutate({ id: taskId, status: newStatus });
    }
  };

  const tasksByStatus = {
    nouveau: tasks.filter((t) => t.status === "nouveau"),
    en_cours: tasks.filter((t) => t.status === "en_cours"),
    termine: tasks.filter((t) => t.status === "termine"),
  };

  // Apply status filter if selected
  const getFilteredTasksByStatus = () => {
    if (!selectedTaskStatus) {
      return tasksByStatus;
    }
    
    if (selectedTaskStatus === 'urgent') {
      // Filter by priority = urgent, grouped by status
      return {
        nouveau: tasks.filter(t => t.status === 'nouveau' && t.priority === 'urgent'),
        en_cours: tasks.filter(t => t.status === 'en_cours' && t.priority === 'urgent'),
        termine: tasks.filter(t => t.status === 'termine' && t.priority === 'urgent'),
      };
    }
    
    // Filter by status
    return {
      nouveau: selectedTaskStatus === 'nouveau' ? tasksByStatus.nouveau : [],
      en_cours: selectedTaskStatus === 'en_cours' ? tasksByStatus.en_cours : [],
      termine: selectedTaskStatus === 'termine' ? tasksByStatus.termine : [],
    };
  };

  const filteredByStatus = getFilteredTasksByStatus();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "haute":
        return "bg-orange-500";
      case "moyenne":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Urgent";
      case "haute":
        return "Haute";
      case "moyenne":
        return "Moyenne";
      case "basse":
        return "Basse";
      default:
        return priority;
    }
  };

  const getAssignedUser = (assignedToId: string | null) => {
    if (!assignedToId) return null;
    return users.find((u) => u.id === assignedToId);
  };

  const getUserInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user.email || "U")[0].toUpperCase();
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return AlertCircle;
      case "haute":
        return Zap;
      case "moyenne":
        return TrendingUp;
      default:
        return Target;
    }
  };

  const TaskCard = ({ task, isDragging }: { task: Task; isDragging?: boolean }) => {
    const assignedUser = getAssignedUser(task.assignedToId);
    const PriorityIcon = getPriorityIcon(task.priority);

    return (
      <Card
        className={`hover-elevate cursor-pointer transition-all border-l-4 ${
          task.priority === "urgent"
            ? "border-l-red-500"
            : task.priority === "haute"
            ? "border-l-orange-500"
            : task.priority === "moyenne"
            ? "border-l-blue-500"
            : "border-l-gray-500"
        } ${isDragging ? "opacity-50" : ""}`}
        onClick={() => setSelectedTask(task)}
        data-testid={`task-card-${task.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <PriorityIcon className={`h-4 w-4 ${
                    task.priority === "urgent"
                      ? "text-red-500"
                      : task.priority === "haute"
                      ? "text-orange-500"
                      : task.priority === "moyenne"
                      ? "text-blue-500"
                      : "text-gray-500"
                  }`} />
                  <Badge
                    className={`${getPriorityColor(task.priority)} text-white text-xs`}
                    data-testid={`task-priority-${task.id}`}
                  >
                    {getPriorityLabel(task.priority)}
                  </Badge>
                </div>
                {task.emailId && (
                  <Mail className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <h3
                className="font-bold text-sm mb-1 line-clamp-2"
                data-testid={`task-title-${task.id}`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {new Date(task.createdAt!).toLocaleDateString("fr-FR")}
                </p>
                {assignedUser && (
                  <div
                    className="flex items-center gap-1"
                    data-testid={`task-assigned-${task.id}`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {getUserInitials(assignedUser)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {assignedUser.firstName && assignedUser.lastName
                        ? `${assignedUser.firstName.charAt(0)}.`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  data-testid={`button-task-menu-${task.id}`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {task.status !== "nouveau" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({
                        id: task.id,
                        status: "nouveau",
                      });
                    }}
                    data-testid={`button-status-nouveau-${task.id}`}
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Marquer comme Nouveau
                  </DropdownMenuItem>
                )}
                {task.status !== "en_cours" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({
                        id: task.id,
                        status: "en_cours",
                      });
                    }}
                    data-testid={`button-status-en_cours-${task.id}`}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Marquer comme En cours
                  </DropdownMenuItem>
                )}
                {task.status !== "termine" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({
                        id: task.id,
                        status: "termine",
                      });
                    }}
                    data-testid={`button-status-termine-${task.id}`}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marquer comme Terminé
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTaskMutation.mutate(task.id);
                  }}
                  className="text-red-600"
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  const DraggableTaskCard = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: task.id,
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

    return (
      <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
        <TaskCard task={task} isDragging={isDragging} />
      </div>
    );
  };

  const StatusColumn = ({
    title,
    icon: Icon,
    tasks,
    status,
  }: {
    title: string;
    icon: any;
    tasks: Task[];
    status: string;
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    });

    const getColumnColor = () => {
      switch (status) {
        case "nouveau":
          return "border-t-4 border-t-blue-500 bg-blue-50/30 dark:bg-blue-950/20";
        case "en_cours":
          return "border-t-4 border-t-orange-500 bg-orange-50/30 dark:bg-orange-950/20";
        case "termine":
          return "border-t-4 border-t-green-500 bg-green-50/30 dark:bg-green-950/20";
        default:
          return "";
      }
    };

    return (
      <div className="flex-1 min-w-0">
        <Card className={`${getColumnColor()} transition-all ${isOver ? "ring-2 ring-primary scale-[1.02]" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <div className="p-2 rounded-lg bg-background/80">
                  <Icon className="h-5 w-5" />
                </div>
                {title}
              </CardTitle>
              <Badge
                className={`text-sm font-bold ${
                  status === "nouveau"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                    : status === "en_cours"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                }`}
                data-testid={`count-${status}`}
              >
                {tasks.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent 
            ref={setNodeRef} 
            className="space-y-3 min-h-[300px]"
            data-testid={`dropzone-${status}`}
          >
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : tasks.length > 0 ? (
              tasks.map((task) => <DraggableTaskCard key={task.id} task={task} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-sm text-center">Aucune tâche</p>
                <p className="text-xs text-center text-muted-foreground/60 mt-1">Déplacez les tâches ici</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header avec statistiques */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckSquare className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="heading-tasks">
                Tâches
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mt-1">
              Gérez vos tâches automatiquement générées depuis vos emails
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Card className="border-l-4 border-l-blue-500 hover-elevate cursor-pointer transition-all" onClick={() => setSelectedTaskStatus(selectedTaskStatus === 'nouveau' ? null : 'nouveau')} data-testid="card-status-nouveau">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nouveau</p>
                    <p className="text-2xl font-bold text-blue-600">{tasksByStatus.nouveau.length}</p>
                  </div>
                  <Circle className="h-8 w-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500 hover-elevate cursor-pointer transition-all" onClick={() => setSelectedTaskStatus(selectedTaskStatus === 'en_cours' ? null : 'en_cours')} data-testid="card-status-en-cours">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En cours</p>
                    <p className="text-2xl font-bold text-orange-600">{tasksByStatus.en_cours.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 hover-elevate cursor-pointer transition-all" onClick={() => setSelectedTaskStatus(selectedTaskStatus === 'termine' ? null : 'termine')} data-testid="card-status-termine">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Terminé</p>
                    <p className="text-2xl font-bold text-green-600">{tasksByStatus.termine.length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 hover-elevate cursor-pointer transition-all" onClick={() => setSelectedTaskStatus(selectedTaskStatus === 'urgent' ? null : 'urgent')} data-testid="card-status-urgent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Urgent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {tasks.filter(t => t.priority === 'urgent').length}
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusColumn
            title="Nouveau"
            icon={Circle}
            tasks={filteredByStatus.nouveau}
            status="nouveau"
          />
          <StatusColumn
            title="En cours"
            icon={Clock}
            tasks={filteredByStatus.en_cours}
            status="en_cours"
          />
          <StatusColumn
            title="Terminé"
            icon={CheckCircle2}
            tasks={filteredByStatus.termine}
            status="termine"
          />
        </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-task-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge
                className={`${getPriorityColor(selectedTask?.priority || "")} text-white`}
              >
                {getPriorityLabel(selectedTask?.priority || "")}
              </Badge>
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>
              Créée le{" "}
              {selectedTask?.createdAt
                ? new Date(selectedTask.createdAt).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTask?.description && (
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>
            )}
            <div>
              <h3 className="font-medium mb-2">Assigné à</h3>
              <Select
                value={selectedTask?.assignedToId || "unassigned"}
                onValueChange={(value) => {
                  if (selectedTask) {
                    updateAssignmentMutation.mutate({
                      id: selectedTask.id,
                      assignedToId: value === "unassigned" ? null : value,
                    });
                  }
                }}
                data-testid="select-task-assignment"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non assignée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Non assignée</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  selectedTask &&
                  updateStatusMutation.mutate({
                    id: selectedTask.id,
                    status:
                      selectedTask.status === "nouveau"
                        ? "en_cours"
                        : selectedTask.status === "en_cours"
                          ? "termine"
                          : "nouveau",
                  })
                }
                data-testid="button-next-status"
              >
                {selectedTask?.status === "nouveau" && "Commencer"}
                {selectedTask?.status === "en_cours" && "Terminer"}
                {selectedTask?.status === "termine" && "Réouvrir"}
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  selectedTask && deleteTaskMutation.mutate(selectedTask.id)
                }
                data-testid="button-delete-task-detail"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
