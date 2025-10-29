import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, addWeeks, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

export type PeriodType = "week" | "month";

export function getPeriodLabel(periodType: PeriodType, offset: number): string {
  const now = new Date();
  
  if (periodType === "week") {
    // offset = 0 => current week
    // offset = 1 => last week
    // offset = -1 => next week
    const targetDate = offset > 0 ? subWeeks(now, offset) : addWeeks(now, Math.abs(offset));
    const start = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(targetDate, { weekStartsOn: 1 }); // Sunday
    
    // Format: "Semaine du 21 au 27 oct 2024"
    if (start.getMonth() === end.getMonth()) {
      return `Semaine du ${format(start, "d", { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`;
    } else {
      return `Semaine du ${format(start, "d MMM", { locale: fr })} au ${format(end, "d MMM yyyy", { locale: fr })}`;
    }
  } else {
    // offset = 0 => current month
    // offset = 1 => last month
    const targetDate = offset > 0 ? subMonths(now, offset) : addMonths(now, Math.abs(offset));
    
    // Format: "Octobre 2024"
    return format(targetDate, "MMMM yyyy", { locale: fr });
  }
}

export function getPeriodDates(periodType: PeriodType, offset: number): { start: Date; end: Date } {
  const now = new Date();
  
  if (periodType === "week") {
    const targetDate = offset > 0 ? subWeeks(now, offset) : addWeeks(now, Math.abs(offset));
    return {
      start: startOfWeek(targetDate, { weekStartsOn: 1 }),
      end: endOfWeek(targetDate, { weekStartsOn: 1 }),
    };
  } else {
    const targetDate = offset > 0 ? subMonths(now, offset) : addMonths(now, Math.abs(offset));
    return {
      start: startOfMonth(targetDate),
      end: endOfMonth(targetDate),
    };
  }
}
