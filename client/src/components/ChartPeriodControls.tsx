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
    <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3">
      {/* Period Type Pills */}
      <div className="flex gap-2 bg-muted/50 p-1 rounded-lg w-full sm:w-auto shrink-0">
        {(['week', 'month'] as const).map((type) => (
          <Button
            key={type}
            size="sm"
            variant={periodType === type ? "default" : "ghost"}
            onClick={() => onPeriodTypeChange(type)}
            className={`flex-1 sm:flex-none rounded-md transition-all text-xs sm:text-sm ${
              periodType === type 
                ? "bg-primary text-primary-foreground" 
                : "hover-elevate"
            }`}
            data-testid={`button-period-${type}-${testIdPrefix}`}
          >
            {type === 'week' ? 'S.' : 'M.'}
          </Button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5 min-w-0 flex-1 sm:flex-initial">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(offset + 1)}
          data-testid={`button-${testIdPrefix}-prev`}
          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground px-0.5 sm:px-2 truncate flex-1 text-center line-clamp-1">
          {periodLabel}
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onOffsetChange(Math.max(0, offset - 1))}
          disabled={offset === 0}
          data-testid={`button-${testIdPrefix}-next`}
          className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
