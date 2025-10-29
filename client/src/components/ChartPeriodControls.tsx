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
    <div className="flex items-center gap-2">
      <Select value={periodType} onValueChange={onPeriodTypeChange}>
        <SelectTrigger
          className="w-32"
          data-testid={`select-period-${testIdPrefix}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Semaine</SelectItem>
          <SelectItem value="month">Mois</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(offset + 1)}
          data-testid={`button-${testIdPrefix}-prev`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground min-w-[200px] text-center">
          {periodLabel}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(Math.max(0, offset - 1))}
          disabled={offset === 0}
          data-testid={`button-${testIdPrefix}-next`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
