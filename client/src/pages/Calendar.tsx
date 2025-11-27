import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Sparkles, Pencil, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, startOfDay, endOfDay } from "date-fns";
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

type ViewMode = "day" | "week" | "month";

export default function Calendar() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Calculate date range based on view mode
  const getDateRange = () => {
    switch (viewMode) {
      case "day":
        return {
          start: startOfDay(currentDate),
          end: endOfDay(currentDate),
        };
      case "week":
        return {
          start: startOfWeek(currentDate, { weekStartsOn: 1 }),
          end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        };
      case "month":
      default:
        return {
          start: startOfMonth(currentDate),
          end: endOfMonth(currentDate),
        };
    }
  };

  const dateRange = getDateRange();

  const { data: appointments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/appointments", {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
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

  // Navigation functions
  const handlePrevious = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "week":
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getFormattedDateRange = () => {
    switch (viewMode) {
      case "day":
        return format(currentDate, "dd MMMM yyyy", { locale: fr });
      case "week": {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, "dd", { locale: fr })} - ${format(weekEnd, "dd MMMM yyyy", { locale: fr })}`;
      }
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: fr });
    }
  };

  // For month view: calculate grid including leading/trailing days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const daysInGrid = eachDayOfInterval({ start: gridStart, end: gridEnd });

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

      {/* Calendar Navigation & View Modes */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">
            {getFormattedDateRange()}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* View Mode Selector */}
            <div className="flex gap-1 bg-muted p-1 rounded-md">
              <Button
                variant={viewMode === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("day")}
                data-testid="button-view-day"
                className="text-xs sm:text-sm"
              >
                Jour
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("week")}
                data-testid="button-view-week"
                className="text-xs sm:text-sm"
              >
                Semaine
              </Button>
              <Button
                variant={viewMode === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("month")}
                data-testid="button-view-month"
                className="text-xs sm:text-sm"
              >
                Mois
              </Button>
            </div>
            {/* Navigation Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevious}
                data-testid="button-prev"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleToday}
                data-testid="button-today"
                className="text-xs sm:text-sm"
              >
                Aujourd'hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                data-testid="button-next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar View - Conditional Rendering */}
        <>
        {viewMode === "month" && (
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
              daysInGrid.map((day) => {
              const dayAppointments = getAppointmentsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);

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
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <div className="space-y-2">
            {isLoading ? (
              [...Array(7)].map((_, i) => <Skeleton key={i} className="h-32" />)
            ) : (
              (() => {
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
                const weekDays = eachDayOfInterval({
                  start: weekStart,
                  end: endOfWeek(currentDate, { weekStartsOn: 1 }),
                });

                return weekDays.map((day) => {
                  const dayAppointments = getAppointmentsForDate(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`p-4 rounded-md border ${isToday ? "border-primary border-2 bg-primary/5" : "border-border bg-card"}`}
                      data-testid={`week-day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-semibold ${isToday ? "text-primary" : ""}`}>
                          {format(day, "EEEE dd MMMM", { locale: fr })}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCreateDialog(day)}
                          data-testid={`button-add-week-${format(day, "yyyy-MM-dd")}`}
                        >
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {dayAppointments.length > 0 ? (
                          dayAppointments.map((apt: any) => (
                            <div
                              key={apt.id}
                              className="p-3 rounded-md bg-muted hover-elevate cursor-pointer"
                              onClick={() => setSelectedAppointment(apt)}
                              data-testid={`week-appointment-${apt.id}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium truncate">{apt.title}</h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {format(new Date(apt.startTime), "HH:mm")} - {format(new Date(apt.endTime), "HH:mm")}
                                    </span>
                                    {apt.location && (
                                      <>
                                        <MapPin className="h-3 w-3 ml-2" />
                                        <span className="truncate">{apt.location}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Aucun rendez-vous
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            )}
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <div className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-96" />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4 p-4 bg-muted rounded-md">
                  <h3 className="font-semibold text-lg">
                    {format(currentDate, "EEEE dd MMMM yyyy", { locale: fr })}
                  </h3>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenCreateDialog(currentDate)}
                    data-testid="button-add-day-appointment"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Nouveau rendez-vous
                  </Button>
                </div>
                <div className="space-y-2">
                  {(() => {
                    const dayAppointments = getAppointmentsForDate(currentDate).sort((a: any, b: any) =>
                      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                    );

                    if (dayAppointments.length === 0) {
                      return (
                        <div className="text-center py-12 border border-dashed rounded-md">
                          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">Aucun rendez-vous pour cette journée</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCreateDialog(currentDate)}
                            className="mt-4"
                            data-testid="button-add-day-empty"
                          >
                            Créer un rendez-vous
                          </Button>
                        </div>
                      );
                    }

                    return dayAppointments.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="p-4 rounded-md border border-border hover-elevate cursor-pointer"
                        onClick={() => setSelectedAppointment(apt)}
                        data-testid={`day-appointment-${apt.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-base font-semibold">{apt.title}</h4>
                              {apt.status && (
                                <Badge variant="outline" className="text-xs">
                                  {apt.status}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {format(new Date(apt.startTime), "HH:mm")} - {format(new Date(apt.endTime), "HH:mm")}
                                </span>
                              </div>
                              {apt.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{apt.location}</span>
                                </div>
                              )}
                              {apt.description && (
                                <p className="mt-2 text-sm">{apt.description}</p>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getTagColor(apt.tag)} flex-shrink-0`}>
                            {apt.tag}
                          </Badge>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
        </>
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
