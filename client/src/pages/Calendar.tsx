import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  startOfHour,
  addHours,
  parse,
  set,
} from "date-fns";
import { fr } from "date-fns/locale";
import "react-day-picker/dist/style.css";

type ViewMode = "month" | "week" | "day";

interface Appointment {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  status: string;
  attendees?: string[];
  aiSuggestions?: {
    prepTasks: string[];
    documents: string[];
    notes: string[];
  };
}

// Modern DateTime Picker Component
function DateTimePickerInput({
  value,
  onChange,
  label,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  testId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const date = value ? new Date(value) : new Date();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    const newDate = set(selectedDate, {
      hours: parseInt(hours),
      minutes: parseInt(minutes),
    });
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
    setIsOpen(false);
  };

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const newDate = set(date, {
      hours: parseInt(newHours),
      minutes: parseInt(newMinutes),
    });
    onChange(format(newDate, "yyyy-MM-dd'T'HH:mm"));
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-2">
        {label} *
      </label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
            data-testid={testId}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value
              ? format(new Date(value), "dd MMM yyyy - HH:mm", { locale: fr })
              : "Sélectionner date/heure"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => date < startOfDay(new Date())}
              locale={fr}
            />
            <div className="flex gap-2 border-t pt-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Heure
                </label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => handleTimeChange(e.target.value, minutes)}
                  className="text-center"
                  placeholder="HH"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Minute
                </label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => handleTimeChange(hours, e.target.value)}
                  className="text-center"
                  placeholder="MM"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Appointment>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<Partial<Appointment>>({
    title: "",
    description: "",
    location: "",
    status: "planifie",
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
  });
  const { toast } = useToast();

  // Fetch appointments
  const { data: appointments = [], isLoading, refetch } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    staleTime: 5 * 60 * 1000,
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete appointment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowAppointmentModal(false);
      toast({ title: "Rendez-vous supprimé", description: "Le rendez-vous a été annulé avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de supprimer le rendez-vous", variant: "destructive" });
      console.error(error);
    },
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Appointment> }) => {
      const response = await fetch(`/api/appointments/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error("Failed to update appointment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowAppointmentModal(false);
      setIsEditMode(false);
      toast({ title: "Rendez-vous modifié", description: "Le rendez-vous a été mis à jour avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de modifier le rendez-vous", variant: "destructive" });
      console.error(error);
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: Partial<Appointment>) => {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          location: data.location,
          status: data.status || "planifie",
          startTime: new Date(data.startTime!),
          endTime: new Date(data.endTime!),
        }),
      });
      if (!response.ok) throw new Error("Failed to create appointment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowCreateModal(false);
      setCreateFormData({
        title: "",
        description: "",
        location: "",
        status: "planifie",
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      });
      toast({ title: "Rendez-vous créé", description: "Le rendez-vous a été créé avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de créer le rendez-vous", variant: "destructive" });
      console.error(error);
    },
  });

  // Get appointments for specific date
  const getAppointmentsForDate = (date: Date) => {
    const start = startOfDay(date);
    const end = endOfDay(date);
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= start && aptDate <= end;
    });
  };

  // Get appointments for week
  const getAppointmentsForWeek = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= weekStart && aptDate <= weekEnd;
    });
  };

  // Get appointments for month
  const getAppointmentsForMonth = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= monthStart && aptDate <= monthEnd;
    });
  };

  // Get calendar days for month view
  const getCalendarDays = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  // Get week days
  const getWeekDays = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  };

  // Get hours for week/day view
  const getHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planifie: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700",
      confirme: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700",
      annule: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700",
      termine: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700",
    };
    return colors[status] || colors.planifie;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planifie: "Planifié",
      confirme: "Confirmé",
      annule: "Annulé",
      termine: "Terminé",
    };
    return labels[status] || status;
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="h-8 w-8 text-green-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Calendrier
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">Gestion de vos rendez-vous et événements</p>
      </div>

      {/* View Mode Toggle and Create Button */}
      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            onClick={() => setViewMode("day")}
            size="sm"
            data-testid="button-view-day"
          >
            Jour
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            onClick={() => setViewMode("week")}
            size="sm"
            data-testid="button-view-week"
          >
            Semaine
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            onClick={() => setViewMode("month")}
            size="sm"
            data-testid="button-view-month"
          >
            Mois
          </Button>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
          data-testid="button-create-appointment"
        >
          <Plus className="h-4 w-4 mr-1" />
          Créer RDV
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
          data-testid="button-prev-period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {viewMode === "day" && format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          {viewMode === "week" && `Semaine du ${format(selectedDate, "d MMMM", { locale: fr })}`}
          {viewMode === "month" && format(selectedDate, "MMMM yyyy", { locale: fr })}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
          data-testid="button-next-period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-muted-foreground">Chargement du calendrier...</div>
      ) : (
        <>
          {/* Day View */}
          {viewMode === "day" && (
            <Card>
              <CardContent className="p-6">
                {getAppointmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Aucun rendez-vous ce jour</p>
                ) : (
                  <div className="space-y-3">
                    {getAppointmentsForDate(selectedDate).map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 border rounded-lg hover-elevate cursor-pointer"
                        data-testid={`appointment-${apt.id}`}
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setShowAppointmentModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{apt.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(apt.startTime), "HH:mm", { locale: fr })} -{" "}
                              {format(new Date(apt.endTime), "HH:mm", { locale: fr })}
                            </p>
                            {apt.location && (
                              <p className="text-xs text-muted-foreground mt-1">{apt.location}</p>
                            )}
                            {apt.description && (
                              <p className="text-xs text-muted-foreground mt-2">{apt.description}</p>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${getStatusColor(apt.status)}`}>
                            {getStatusLabel(apt.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Week View - Timeline Style */}
          {viewMode === "week" && (
            <Card>
              <CardContent className="p-4">
                {/* Sticky Header with Days */}
                <div className="grid gap-1 sticky top-0 z-50 bg-card mb-2" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
                  <div className="font-semibold text-xs text-center p-2">Heure</div>
                  {getWeekDays().map((day, idx) => (
                    <div
                      key={day.toISOString()}
                      className={`font-semibold text-xs text-center p-2 rounded border-r border-dashed border-border ${
                        isSameDay(day, selectedDate) ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div>{format(day, "EEE", { locale: fr })}</div>
                      <div className="text-sm">{format(day, "d")}</div>
                    </div>
                  ))}
                </div>

                {/* Scrollable Content */}
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="grid gap-1" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
                      {/* Hours and appointments */}
                      {getHours().map((hour) => (
                        <div key={`row-${hour}`} className="contents">
                          <div className="text-xs text-muted-foreground text-center p-2 border-t">
                            {String(hour).padStart(2, "0")}:00
                          </div>
                          {getWeekDays().map((day) => {
                            const dayAppointments = getAppointmentsForDate(day).filter((apt) => {
                              const aptHour = new Date(apt.startTime).getHours();
                              return aptHour === hour;
                            });

                            return (
                              <div
                                key={`${day.toISOString()}-${hour}`}
                                className="border-t border-r border-dashed border-border p-1 min-h-16 relative overflow-hidden"
                              >
                                {dayAppointments.map((apt) => (
                                  <div
                                    key={apt.id}
                                    className={`text-xs p-1 rounded border mb-1 cursor-pointer hover-elevate truncate max-w-full ${getStatusColor(apt.status)}`}
                                    title={apt.title}
                                    data-testid={`appointment-${apt.id}`}
                                    onClick={() => {
                                      setSelectedAppointment(apt);
                                      setShowAppointmentModal(true);
                                    }}
                                  >
                                    <div className="font-medium truncate">{apt.title}</div>
                                    <div className="text-xs">
                                      {format(new Date(apt.startTime), "HH:mm", { locale: fr })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Month View - Calendar Grid */}
          {viewMode === "month" && (
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {/* Day headers */}
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                    <div key={day} className="font-semibold text-center p-2 text-sm">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {getCalendarDays().map((day) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const isCurrentMonth = isSameMonth(day, selectedDate);
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`border rounded-lg p-2 min-h-24 cursor-pointer hover-elevate ${
                          isSelected
                            ? "bg-primary/10 border-primary"
                            : !isCurrentMonth
                              ? "bg-muted/30 text-muted-foreground"
                              : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedDate(day)}
                        data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                      >
                        <div className={`text-sm font-semibold mb-1 ${!isCurrentMonth ? "opacity-50" : ""}`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1 text-xs max-h-16 overflow-y-auto">
                          {dayAppointments.slice(0, 3).map((apt) => (
                            <div
                              key={apt.id}
                              className={`p-1 rounded truncate border cursor-pointer hover-elevate ${getStatusColor(apt.status)}`}
                              title={apt.title}
                              data-testid={`appointment-${apt.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(apt);
                                setShowAppointmentModal(true);
                              }}
                            >
                              {apt.title}
                            </div>
                          ))}
                          {dayAppointments.length > 3 && (
                            <div className="text-muted-foreground italic text-xs">
                              +{dayAppointments.length - 3} plus
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {viewMode === "day"
                      ? getAppointmentsForDate(selectedDate).length
                      : viewMode === "week"
                        ? getAppointmentsForWeek().length
                        : getAppointmentsForMonth().length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {viewMode === "day" ? "Rendez-vous" : viewMode === "week" ? "Cette semaine" : "Ce mois"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {(
                      viewMode === "day"
                        ? getAppointmentsForDate(selectedDate)
                        : viewMode === "week"
                          ? getAppointmentsForWeek()
                          : getAppointmentsForMonth()
                    ).filter((a) => a.status === "confirme").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Confirmés</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {(
                      viewMode === "day"
                        ? getAppointmentsForDate(selectedDate)
                        : viewMode === "week"
                          ? getAppointmentsForWeek()
                          : getAppointmentsForMonth()
                    ).filter((a) => a.status === "planifie").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Planifiés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Appointment Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Créer un rendez-vous</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Title Field */}
            <div>
              <label className="text-sm font-medium block mb-2">Titre *</label>
              <Input
                value={createFormData.title || ""}
                onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                placeholder="Titre du rendez-vous"
                data-testid="input-create-title"
              />
            </div>

            {/* Date/Time Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Date et heure</p>
              </div>
              
              <DateTimePickerInput
                value={createFormData.startTime || ""}
                onChange={(value) => setCreateFormData({ ...createFormData, startTime: value })}
                label="Début"
                testId="input-create-start-time"
              />
              
              <DateTimePickerInput
                value={createFormData.endTime || ""}
                onChange={(value) => setCreateFormData({ ...createFormData, endTime: value })}
                label="Fin"
                testId="input-create-end-time"
              />
            </div>

            {/* Location Field */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium">Lieu</label>
              </div>
              <Input
                value={createFormData.location || ""}
                onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                placeholder="Lieu du rendez-vous"
                data-testid="input-create-location"
              />
            </div>

            {/* Description Field */}
            <div className="pt-2 border-t">
              <label className="text-sm font-medium block mb-2">Description</label>
              <Textarea
                value={createFormData.description || ""}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Description du rendez-vous"
                data-testid="input-create-description"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => {
                  if (!createFormData.title || !createFormData.startTime || !createFormData.endTime) {
                    toast({ title: "Erreur", description: "Veuillez remplir les champs obligatoires", variant: "destructive" });
                    return;
                  }
                  createAppointmentMutation.mutate(createFormData);
                }}
                disabled={createAppointmentMutation.isPending}
                data-testid="button-save-create"
              >
                {createAppointmentMutation.isPending ? "Création..." : "Créer"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
                data-testid="button-cancel-create"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Modal */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedAppointment?.title}</DialogTitle>
            {selectedAppointment && (
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium w-fit ${getStatusColor(selectedAppointment.status)}`}
              >
                {getStatusLabel(selectedAppointment.status)}
              </span>
            )}
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {isEditMode ? (
                // Edit Form
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <Input
                      value={editData.title || selectedAppointment.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      data-testid="input-appointment-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={editData.description || selectedAppointment.description || ""}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      data-testid="input-appointment-description"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Lieu</label>
                    <Input
                      value={editData.location || selectedAppointment.location || ""}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      data-testid="input-appointment-location"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        updateAppointmentMutation.mutate({
                          id: selectedAppointment.id,
                          updates: editData,
                        });
                      }}
                      disabled={updateAppointmentMutation.isPending}
                      data-testid="button-save-appointment"
                    >
                      {updateAppointmentMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsEditMode(false)}
                      data-testid="button-cancel-edit"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  {/* Date and Time */}
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(selectedAppointment.startTime), "EEEE d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedAppointment.startTime), "HH:mm", { locale: fr })} -{" "}
                        {format(new Date(selectedAppointment.endTime), "HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {selectedAppointment.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Lieu</p>
                        <p className="text-sm text-muted-foreground">{selectedAppointment.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Attendees */}
                  {selectedAppointment.attendees && Array.isArray(selectedAppointment.attendees) && selectedAppointment.attendees.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Participants</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAppointment.attendees.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedAppointment.description && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Description</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedAppointment.description}
                      </p>
                    </div>
                  )}

                  {/* AI Suggestions - Preparation Tasks */}
                  {selectedAppointment.aiSuggestions?.prepTasks && selectedAppointment.aiSuggestions.prepTasks.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Tâches de préparation suggérées</p>
                      <ul className="space-y-1">
                        {selectedAppointment.aiSuggestions.prepTasks.map((task, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Suggestions - Required Documents */}
                  {selectedAppointment.aiSuggestions?.documents && selectedAppointment.aiSuggestions.documents.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Documents requis</p>
                      <ul className="space-y-1">
                        {selectedAppointment.aiSuggestions.documents.map((doc, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{doc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Suggestions - Notes */}
                  {selectedAppointment.aiSuggestions?.notes && selectedAppointment.aiSuggestions.notes.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Notes importantes</p>
                      <ul className="space-y-1">
                        {selectedAppointment.aiSuggestions.notes.map((note, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditMode(true);
                        setEditData({});
                      }}
                      data-testid="button-edit-appointment"
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => deleteAppointmentMutation.mutate(selectedAppointment.id)}
                      disabled={deleteAppointmentMutation.isPending}
                      data-testid="button-delete-appointment"
                    >
                      {deleteAppointmentMutation.isPending ? "Suppression..." : "Supprimer"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
