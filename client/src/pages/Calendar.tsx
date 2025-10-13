import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Sparkles } from "lucide-react";
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

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["/api/appointments", {
      start: startOfMonth(currentMonth).toISOString(),
      end: endOfMonth(currentMonth).toISOString(),
    }],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDate = (date: Date) => {
    if (!appointments) return [];
    return appointments.filter((apt: any) =>
      isSameDay(new Date(apt.startTime), date)
    );
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
        <Button data-testid="button-add-appointment">
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
        ) : appointments && appointments.slice(0, 5).length > 0 ? (
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

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedAppointment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAppointment?.startTime &&
                format(new Date(selectedAppointment.startTime), "dd MMMM yyyy à HH:mm", { locale: fr })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAppointment?.description && (
              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedAppointment.description}</p>
              </div>
            )}

            {selectedAppointment?.location && (
              <div>
                <h3 className="text-sm font-medium mb-2">Lieu</h3>
                <p className="text-sm text-muted-foreground">{selectedAppointment.location}</p>
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
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline">Modifier</Button>
              <Button variant="destructive">Annuler le RDV</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
