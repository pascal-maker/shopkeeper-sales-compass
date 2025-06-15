
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as DateCalendar } from "@/components/ui/calendar";

interface SalesHistoryFiltersProps {
  filterType: "week" | "month" | "custom";
  setFilterType: (t: "week" | "month" | "custom") => void;
  customRange: { from?: Date; to?: Date };
  setCustomRange: React.Dispatch<React.SetStateAction<{ from?: Date; to?: Date }>>;
  dateRange: { from: Date; to: Date };
  filteredLength: number;
}

export const SalesHistoryFilters: React.FC<SalesHistoryFiltersProps> = ({
  filterType,
  setFilterType,
  customRange,
  setCustomRange,
  dateRange,
  filteredLength,
}) => {
  return (
    <Card>
      <CardContent className="py-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={filterType === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("week")}
          >
            This Week
          </Button>
          <Button
            variant={filterType === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("month")}
          >
            This Month
          </Button>
          <Button
            variant={filterType === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("custom")}
          >
            Custom
          </Button>
        </div>
        {filterType === "custom" && (
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-sm text-muted-foreground">From</span>
            <DateCalendar
              mode="single"
              selected={customRange.from}
              onSelect={date => setCustomRange(r => ({ ...r, from: date ?? undefined }))}
              className="w-fit"
            />
            <span className="text-sm text-muted-foreground">To</span>
            <DateCalendar
              mode="single"
              selected={customRange.to}
              onSelect={date => setCustomRange(r => ({ ...r, to: date ?? undefined }))}
              className="w-fit"
            />
          </div>
        )}
        <div className="ml-auto flex items-center text-xs text-muted-foreground">
          Showing {filteredLength} sale{filteredLength !== 1 && "s"} from{" "}
          <span className="ml-1 font-medium">
            {dateRange.from.toLocaleDateString()}
          </span>{" "}
          to{" "}
          <span className="ml-1 font-medium">
            {dateRange.to.toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
