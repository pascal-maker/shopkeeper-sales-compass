
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { useSettings } from "@/contexts/SettingsContext";

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
  const { t } = useSettings();
  return (
    <Card>
      <CardContent className="py-4 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={filterType === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("week")}
          >
            {t('thisWeek')}
          </Button>
          <Button
            variant={filterType === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("month")}
          >
            {t('thisMonth')}
          </Button>
          <Button
            variant={filterType === "custom" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("custom")}
          >
            {t('custom')}
          </Button>
        </div>
        {filterType === "custom" && (
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('from')}</span>
            <DateCalendar
              mode="single"
              selected={customRange.from}
              onSelect={date => setCustomRange(r => ({ ...r, from: date ?? undefined }))}
              className="w-fit"
            />
            <span className="text-sm text-muted-foreground">{t('to')}</span>
            <DateCalendar
              mode="single"
              selected={customRange.to}
              onSelect={date => setCustomRange(r => ({ ...r, to: date ?? undefined }))}
              className="w-fit"
            />
          </div>
        )}
        <div className="ml-auto flex items-center text-xs text-muted-foreground">
          {t('showing')} {filteredLength} {filteredLength !== 1 ? t('sales') : t('sale')} {t('from')}{" "}
          <span className="ml-1 font-medium">
            {dateRange.from.toLocaleDateString()}
          </span>{" "}
          {t('to')}{" "}
          <span className="ml-1 font-medium">
            {dateRange.to.toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
