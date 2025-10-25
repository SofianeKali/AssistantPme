import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CheckCircle2, Circle, Clock, MoreVertical, Trash2, Mail } from "lucide-react";
import type { Task } from "@shared/schema";

export default function Tasks() {
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
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

  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      className="hover-elevate cursor-pointer"
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
            <h3 className="font-medium text-sm mb-1 line-clamp-2" data-testid={`task-title-${task.id}`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(task.createdAt!).toLocaleDateString('fr-FR')}
            </p>
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
                    updateStatusMutation.mutate({ id: task.id, status: "nouveau" });
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
                    updateStatusMutation.mutate({ id: task.id, status: "en_cours" });
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
                    updateStatusMutation.mutate({ id: task.id, status: "termine" });
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
  }) => (
    <div className="flex-1 min-w-0">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-auto" data-testid={`count-${status}`}>
              {tasks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : tasks.length > 0 ? (
            tasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune tâche
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
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
              {selectedTask?.createdAt &&
                new Date(selectedTask.createdAt).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
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
                onClick={() => selectedTask && deleteTaskMutation.mutate(selectedTask.id)}
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
  );
}
