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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
      {/* Period Type Pills */}
      <div className="flex gap-2 bg-muted/50 p-1 rounded-lg w-full sm:w-auto">
        {(['week', 'month'] as const).map((type) => (
          <Button
            key={type}
            size="sm"
            variant={periodType === type ? "default" : "ghost"}
            onClick={() => onPeriodTypeChange(type)}
            className={`flex-1 sm:flex-none rounded-md transition-all ${
              periodType === type 
                ? "bg-primary text-primary-foreground" 
                : "hover-elevate"
            }`}
            data-testid={`button-period-${type}-${testIdPrefix}`}
          >
            {type === 'week' ? 'Semaine' : 'Mois'}
          </Button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(offset + 1)}
          data-testid={`button-${testIdPrefix}-prev`}
          className="h-8 w-8 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground px-2 whitespace-nowrap min-w-[140px] text-center">
          {periodLabel}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(Math.max(0, offset - 1))}
          disabled={offset === 0}
          data-testid={`button-${testIdPrefix}-next`}
          className="h-8 w-8 shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
