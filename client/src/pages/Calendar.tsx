import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Sparkles, Pencil, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDayAppointmentsDialog, setShowDayAppointmentsDialog] = useState(false);
  const [dayAppointmentsList, setDayAppointmentsList] = useState<any[]>([]);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
  });
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    tag: "client",
  });
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/appointments", {
      start: startOfMonth(currentMonth).toISOString(),
      end: endOfMonth(currentMonth).toISOString(),
    }],
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest("PATCH", `/api/appointments/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsEditing(false);
      setSelectedAppointment(null);
      toast({
        title: "Rendez-vous modifié",
        description: "Le rendez-vous a été mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le rendez-vous",
        variant: "destructive",
      });
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/appointments/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowDeleteDialog(false);
      setSelectedAppointment(null);
      toast({
        title: "Rendez-vous annulé",
        description: "Le rendez-vous a été annulé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le rendez-vous",
        variant: "destructive",
      });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/appointments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowCreateDialog(false);
      setCreateForm({
        title: "",
        description: "",
        location: "",
        startTime: "",
        endTime: "",
        tag: "client",
      });
      toast({
        title: "Rendez-vous créé",
        description: "Le nouveau rendez-vous a été créé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le rendez-vous",
        variant: "destructive",
      });
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleEdit = () => {
    if (selectedAppointment) {
      setEditForm({
        title: selectedAppointment.title,
        description: selectedAppointment.description || "",
        location: selectedAppointment.location || "",
        startTime: format(new Date(selectedAppointment.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(selectedAppointment.endTime), "yyyy-MM-dd'T'HH:mm"),
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (selectedAppointment) {
      updateAppointmentMutation.mutate({
        id: selectedAppointment.id,
        updates: {
          title: editForm.title,
          description: editForm.description,
          location: editForm.location,
          startTime: new Date(editForm.startTime).toISOString(),
          endTime: new Date(editForm.endTime).toISOString(),
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      title: "",
      description: "",
      location: "",
      startTime: "",
      endTime: "",
    });
  };

  const handleDelete = () => {
    if (selectedAppointment) {
      deleteAppointmentMutation.mutate(selectedAppointment.id);
    }
  };

  const handleCreateAppointment = () => {
    if (!createForm.title || !createForm.startTime || !createForm.endTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }
    createAppointmentMutation.mutate({
      title: createForm.title,
      description: createForm.description,
      location: createForm.location,
      startTime: new Date(createForm.startTime).toISOString(),
      endTime: new Date(createForm.endTime).toISOString(),
      tag: createForm.tag,
    });
  };

  const handleOpenCreateDialog = (date?: Date) => {
    const baseDate = date || new Date();
    const defaultStart = new Date(baseDate);
    defaultStart.setHours(10, 0, 0, 0);
    const defaultEnd = new Date(baseDate);
    defaultEnd.setHours(11, 0, 0, 0);
    
    setCreateForm({
      title: "",
      description: "",
      location: "",
      startTime: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
      tag: "client",
    });
    setShowCreateDialog(true);
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt: any) => {
      const aptDate = new Date(apt.startTime);
      // Compare using local date strings to avoid timezone issues
      const aptDateStr = format(aptDate, "yyyy-MM-dd");
      const targetDateStr = format(date, "yyyy-MM-dd");
      return aptDateStr === targetDateStr;
    });
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      client: "bg-chart-1/10 text-chart-1",
      fournisseur: "bg-chart-3/10 text-chart-3",
      interne: "bg-chart-2/10 text-chart-2",
    };
    return colors[tag] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Calendrier</h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de vos rendez-vous
          </p>
        </div>
        <Button data-testid="button-add-appointment" onClick={() => handleOpenCreateDialog()}>
          <CalendarIcon className="h-4 w-4 mr-2" />
          Nouveau RDV
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentMonth(new Date())}
              data-testid="button-today"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground pb-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {isLoading ? (
            [...Array(35)].map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            daysInMonth.map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    if (dayAppointments.length === 1) {
                      setSelectedAppointment(dayAppointments[0]);
                    } else if (dayAppointments.length > 1) {
                      setDayAppointmentsList(dayAppointments);
                      setShowDayAppointmentsDialog(true);
                    }
                  }}
                  className={`
                    min-h-24 p-2 rounded-md border text-left
                    ${isCurrentMonth ? "bg-card" : "bg-muted/30"}
                    ${isToday ? "border-primary border-2" : "border-border"}
                    hover-elevate
                  `}
                  data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((apt: any) => (
                      <div
                        key={apt.id}
                        className="text-xs p-1 rounded bg-primary/10 text-primary truncate"
                      >
                        {format(new Date(apt.startTime), "HH:mm")} {apt.title}
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayAppointments.length - 2} autres
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Prochains rendez-vous</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : appointments && Array.isArray(appointments) && appointments.slice(0, 5).length > 0 ? (
          <div className="space-y-3">
            {appointments.slice(0, 5).map((apt: any) => (
              <div
                key={apt.id}
                className="p-4 rounded-md border border-border hover-elevate cursor-pointer"
                onClick={() => setSelectedAppointment(apt)}
                data-testid={`appointment-${apt.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold">{apt.title}</h3>
                      {apt.status && (
                        <Badge variant="outline" className="text-xs">
                          {apt.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(apt.startTime), "dd MMMM yyyy à HH:mm", { locale: fr })}
                        </span>
                      </div>
                      {apt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{apt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucun rendez-vous planifié
          </div>
        )}
      </Card>

      {/* Day Appointments Selection Dialog */}
      <Dialog open={showDayAppointmentsDialog} onOpenChange={setShowDayAppointmentsDialog}>
        <DialogContent className="max-w-lg w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rendez-vous du {selectedDate && format(selectedDate, "dd MMMM yyyy", { locale: fr })}</DialogTitle>
            <DialogDescription>
              Sélectionnez un rendez-vous pour voir les détails
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {dayAppointmentsList.map((apt: any) => (
              <div
                key={apt.id}
                className="p-4 rounded-md border border-border hover-elevate cursor-pointer"
                onClick={() => {
                  setSelectedAppointment(apt);
                  setShowDayAppointmentsDialog(false);
                }}
                data-testid={`day-appointment-${apt.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold">{apt.title}</h3>
                      {apt.status && (
                        <Badge variant="outline" className="text-xs">
                          {apt.status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(apt.startTime), "HH:mm")} - {format(new Date(apt.endTime), "HH:mm")}
                        </span>
                      </div>
                      {apt.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{apt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau rendez-vous</DialogTitle>
            <DialogDescription>
              Remplissez les informations du rendez-vous
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-title">Titre *</Label>
              <Input
                id="create-title"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Titre du rendez-vous"
                data-testid="input-create-title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-start">Date et heure de début *</Label>
                <Input
                  id="create-start"
                  type="datetime-local"
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                  data-testid="input-create-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-end">Date et heure de fin *</Label>
                <Input
                  id="create-end"
                  type="datetime-local"
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                  data-testid="input-create-end"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-location">Lieu</Label>
              <Input
                id="create-location"
                value={createForm.location}
                onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                placeholder="Lieu du rendez-vous"
                data-testid="input-create-location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Description du rendez-vous"
                rows={4}
                data-testid="input-create-description"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                data-testid="button-cancel-create"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateAppointment}
                disabled={createAppointmentMutation.isPending}
                data-testid="button-save-create"
              >
                {createAppointmentMutation.isPending ? "Création..." : "Créer le rendez-vous"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => {
        if (!open) {
          setSelectedAppointment(null);
          setIsEditing(false);
        }
      }}>
        <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-xl break-words pr-8">
              {isEditing ? "Modifier le rendez-vous" : selectedAppointment?.title}
            </DialogTitle>
            {!isEditing && (
              <DialogDescription className="break-words">
                {selectedAppointment?.startTime &&
                  format(new Date(selectedAppointment.startTime), "dd MMMM yyyy à HH:mm", { locale: fr })}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 overflow-x-hidden">
            {isEditing ? (
              /* Edit Form */
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Titre *</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Titre du rendez-vous"
                    data-testid="input-edit-title"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start">Début *</Label>
                    <Input
                      id="edit-start"
                      type="datetime-local"
                      value={editForm.startTime}
                      onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                      data-testid="input-edit-start"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end">Fin *</Label>
                    <Input
                      id="edit-end"
                      type="datetime-local"
                      value={editForm.endTime}
                      onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                      data-testid="input-edit-end"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-location">Lieu</Label>
                  <Input
                    id="edit-location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="Adresse ou lieu du rendez-vous"
                    data-testid="input-edit-location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Détails du rendez-vous"
                    rows={4}
                    data-testid="textarea-edit-description"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateAppointmentMutation.isPending || !editForm.title}
                    data-testid="button-save-edit"
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    {updateAppointmentMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateAppointmentMutation.isPending}
                    data-testid="button-cancel-edit"
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                </div>
              </>
            ) : (
              /* View Mode */
              <>
                {selectedAppointment?.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                      {selectedAppointment.description}
                    </p>
                  </div>
                )}

                {selectedAppointment?.location && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Lieu</h3>
                    <p className="text-sm text-muted-foreground break-words">
                      {selectedAppointment.location}
                    </p>
                  </div>
                )}

                {selectedAppointment?.aiSuggestions && (
                  <div className="p-4 rounded-md bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Suggestions de préparation</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      {selectedAppointment.aiSuggestions.prepTasks?.map((task: string, i: number) => (
                        <li key={i} className="break-words">{task}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleEdit}
                    data-testid="button-edit"
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    data-testid="button-delete"
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Annuler le RDV
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[95vw] md:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={deleteAppointmentMutation.isPending}
              data-testid="button-cancel-delete"
              className="w-full sm:w-auto"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAppointmentMutation.isPending}
              data-testid="button-confirm-delete"
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAppointmentMutation.isPending ? "Suppression..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
