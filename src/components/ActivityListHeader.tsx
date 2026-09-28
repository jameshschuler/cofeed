import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { FeedFilter, VolumeUnit } from "../types/route-types";

const FILTERS: Array<{ value: FeedFilter; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "date", label: "Date" },
];

export function ActivityListHeader({
  title,
  filter,
  selectedDate,
  displayVolumeUnit,
  onFilterChange,
  onDateChange,
}: {
  title: string;
  filter: FeedFilter;
  selectedDate: string | null;
  displayVolumeUnit: VolumeUnit;
  onFilterChange: (filter: FeedFilter) => void;
  onDateChange: (date: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="grid grid-cols-3 overflow-hidden rounded-lg bg-muted">
          {FILTERS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={filter === option.value ? "default" : "ghost"}
              className="h-8 rounded-none"
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {filter === "date" ? (
          <Input
            type="date"
            className="h-8 w-auto text-xs"
            value={selectedDate ?? ""}
            onChange={(e) => onDateChange(e.target.value || null)}
          />
        ) : null}
        <div className="flex items-center rounded-lg border border-border/70 px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            Display: {displayVolumeUnit}
          </span>
        </div>
      </div>
    </div>
  );
}
