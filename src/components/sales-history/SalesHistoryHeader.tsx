
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

interface SalesHistoryHeaderProps {
  onBack?: () => void;
}

export const SalesHistoryHeader: React.FC<SalesHistoryHeaderProps> = ({ onBack }) => {
  const { t } = useSettings();
  
  return (
    <div className="flex items-center gap-4">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div>
        <h1 className="text-2xl font-bold">{t('SalesHistory')}</h1>
        <p className="text-muted-foreground">{t('TrackSales')}</p>
      </div>
    </div>
  );
};
