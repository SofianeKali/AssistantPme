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

  const TaskCard = ({ task, isDragging }: { task: Task; isDragging?: boolean }) => {
    const assignedUser = getAssignedUser(task.assignedToId);

    return (
      <Card
        className={`hover-elevate cursor-pointer ${isDragging ? "opacity-50" : ""}`}
        onClick={() => setSelectedTask(task)}
        data-testid={`task-card-${task.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  className={`${getPriorityColor(task.priority)} text-white`}
                  data-testid={`task-priority-${task.id}`}
                >
                  {getPriorityLabel(task.priority)}
                </Badge>
                {task.emailId && (
                  <Mail className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <h3
                className="font-medium text-sm mb-1 line-clamp-2"
                data-testid={`task-title-${task.id}`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
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
                    <span className="text-xs text-muted-foreground">
                      {assignedUser.firstName && assignedUser.lastName
                        ? `${assignedUser.firstName} ${assignedUser.lastName}`
                        : assignedUser.email}
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

    return (
      <div className="flex-1 min-w-0">
        <Card className={isOver ? "ring-2 ring-primary" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icon className="h-5 w-5" />
              {title}
              <Badge
                variant={
                  status === "nouveau" 
                    ? "secondary" 
                    : status === "termine"
                    ? "outline"
                    : "default"
                }
                className={`ml-auto ${
                  status === "termine" 
                    ? "bg-chart-2/20 text-chart-2 border-chart-2" 
                    : ""
                }`}
                data-testid={`count-${status}`}
              >
                {tasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent 
            ref={setNodeRef} 
            className="space-y-3 min-h-[200px]"
            data-testid={`dropzone-${status}`}
          >
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)
            ) : tasks.length > 0 ? (
              tasks.map((task) => <DraggableTaskCard key={task.id} task={task} />)
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune tâche
              </p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-tasks">
              Tâches
            </h1>
            <p className="text-muted-foreground">
              Gérez vos tâches automatiquement générées depuis vos emails
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusColumn
            title="Nouveau"
            icon={Circle}
            tasks={tasksByStatus.nouveau}
            status="nouveau"
          />
          <StatusColumn
            title="En cours"
            icon={Clock}
            tasks={tasksByStatus.en_cours}
            status="en_cours"
          />
          <StatusColumn
            title="Terminé"
            icon={CheckCircle2}
            tasks={tasksByStatus.termine}
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
