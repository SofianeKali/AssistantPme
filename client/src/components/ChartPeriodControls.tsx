import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PeriodType = "week" | "month";

interface ChartPeriodControlsProps {
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  offset: number;
  onOffsetChange: (offset: number) => void;
  periodLabel: string;
  testIdPrefix: string;
}

export function ChartPeriodControls({
  periodType,
  onPeriodTypeChange,
  offset,
  onOffsetChange,
  periodLabel,
  testIdPrefix,
}: ChartPeriodControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:max-w-md min-w-0">
      <Select value={periodType} onValueChange={onPeriodTypeChange}>
        <SelectTrigger
          className="w-full sm:w-32 shrink-0"
          data-testid={`select-period-${testIdPrefix}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Semaine</SelectItem>
          <SelectItem value="month">Mois</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-initial overflow-hidden">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(offset + 1)}
          data-testid={`button-${testIdPrefix}-prev`}
          className="shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-0 text-center px-2 truncate flex-1 sm:flex-initial sm:max-w-[200px]">
          {periodLabel}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(Math.max(0, offset - 1))}
          disabled={offset === 0}
          data-testid={`button-${testIdPrefix}-next`}
          className="shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
