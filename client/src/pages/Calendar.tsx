import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
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
}

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    staleTime: 5 * 60 * 1000,
  });

  // Filter appointments based on view mode
  const getFilteredAppointments = () => {
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);

    if (viewMode === "month") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= monthStart && aptDate <= monthEnd;
      });
    }

    if (viewMode === "week") {
      const weekStart = new Date(selectedDate);
      weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= weekStart && aptDate <= weekEnd;
      });
    }

    // Day view
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= start && aptDate <= end;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  // Get appointments for specific date (for month/week view display)
  const getAppointmentsForDate = (date: Date) => {
    const start = startOfDay(date);
    const end = endOfDay(date);
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= start && aptDate <= end;
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planifie: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
      confirme: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
      annule: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
      termine: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200",
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

      {/* View Mode Toggle */}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Picker */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
                className="p-1 hover:bg-muted rounded"
                data-testid="button-prev-month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">
                {format(selectedDate, "MMMM yyyy", { locale: fr })}
              </span>
              <button
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
                className="p-1 hover:bg-muted rounded"
                data-testid="button-next-month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={fr}
              classNames={{
                months: "w-full",
                month: "w-full",
                caption: "hidden",
                head_row: "grid grid-cols-7 gap-1 mb-1",
                head_cell: "h-8 text-xs font-medium text-center",
                row: "grid grid-cols-7 gap-1",
                cell: "h-8 text-xs text-center",
                day: "h-8 w-8 p-0 hover:bg-muted rounded text-xs",
                day_selected: "bg-primary text-primary-foreground rounded hover:bg-primary",
                day_today: "bg-accent font-bold",
                day_outside: "text-muted-foreground opacity-50",
              }}
            />
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Appointments Display */}
          {viewMode === "day" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : getAppointmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun rendez-vous ce jour</p>
                ) : (
                  <div className="space-y-3">
                    {getAppointmentsForDate(selectedDate).map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 border rounded-lg hover-elevate"
                        data-testid={`appointment-${apt.id}`}
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
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${getStatusColor(apt.status)}`}
                          >
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

          {viewMode === "week" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Semaine du {format(selectedDate, "d MMMM", { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : filteredAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun rendez-vous cette semaine</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 border rounded-lg hover-elevate"
                        data-testid={`appointment-${apt.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(apt.startTime), "EEEE d", { locale: fr })}
                            </p>
                            <h3 className="font-medium text-sm mt-1">{apt.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(apt.startTime), "HH:mm", { locale: fr })} -{" "}
                              {format(new Date(apt.endTime), "HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${getStatusColor(apt.status)}`}
                          >
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

          {viewMode === "month" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rendez-vous du mois</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : filteredAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Aucun rendez-vous ce mois</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredAppointments
                      .sort(
                        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
                      )
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="p-3 border rounded-lg hover-elevate"
                          data-testid={`appointment-${apt.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(apt.startTime), "EEEE d MMMM", { locale: fr })}
                              </p>
                              <h3 className="font-medium text-sm mt-1">{apt.title}</h3>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(apt.startTime), "HH:mm", { locale: fr })}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${getStatusColor(apt.status)}`}
                            >
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

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{filteredAppointments.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {viewMode === "day"
                      ? "Rendez-vous"
                      : viewMode === "week"
                        ? "Semaine"
                        : "Mois"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {filteredAppointments.filter((a) => a.status === "confirme").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Confirmés</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredAppointments.filter((a) => a.status === "planifie").length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Planifiés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
