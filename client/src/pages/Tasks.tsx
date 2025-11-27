import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Circle, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function SortableTaskItem({ task, onDelete, onStatusChange }: any) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: task.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "nouveau":
        return "border-l-blue-500";
      case "en_cours":
        return "border-l-orange-500";
      case "termine":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "nouveau":
        return Circle;
      case "en_cours":
        return Clock;
      case "termine":
        return CheckCircle2;
      default:
        return Circle;
    }
  };

  const StatusIcon = getStatusIcon(task.status);
  const statusLabel = task.status === "en_cours" ? "En cours" : task.status === "termine" ? "Terminé" : "Nouveau";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/20 dark:to-slate-900/5 hover-elevate cursor-pointer transition-all border-l-4 ${getStatusBgColor(
        task.status
      )}`}
      data-testid={`task-${task.id}`}
      {...attributes}
      {...listeners}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-background/80 mt-0.5">
            <StatusIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {task.description}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {task.priority && (
                <Badge variant="secondary" className="text-xs">
                  {task.priority}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {statusLabel}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            data-testid="button-delete-task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function Tasks() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      apiRequest(`/api/tasks/${data.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiRequest(`/api/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Tâche supprimée" });
    },
  });

  const filteredTasks = tasks?.filter(
    (task: any) => statusFilter === "all" || task.status === statusFilter
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const activeTask = tasks.find((t: any) => t.id === active.id);
      updateStatusMutation.mutate({
        id: activeTask.id,
        status: over.id,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Tâches
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos tâches et suivez leur progression
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-foreground">Filtre:</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les tâches</SelectItem>
            <SelectItem value="nouveau">Nouveau</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card className="bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/20 dark:to-slate-900/5">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Chargement...</p>
            </CardContent>
          </Card>
        ) : filteredTasks?.length === 0 ? (
          <Card className="bg-gradient-to-br from-slate-50/30 to-slate-50/10 dark:from-slate-900/20 dark:to-slate-900/5">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Aucune tâche</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks?.map((t: any) => t.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {filteredTasks?.map((task: any) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  onDelete={(id: string) => deleteTaskMutation.mutate(id)}
                  onStatusChange={(status: string) =>
                    updateStatusMutation.mutate({ id: task.id, status })
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
