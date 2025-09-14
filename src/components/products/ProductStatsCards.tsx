
import { Card, CardContent } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";

interface ProductStatsCardsProps {
  totalProducts: number;
  lowStockCount: number;
}

export const ProductStatsCards = ({
  totalProducts,
  lowStockCount,
}: ProductStatsCardsProps) => {
  const { t } = useSettings();
  
  return (
  <div className="grid grid-cols-2 gap-4 mb-6">
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-primary">{totalProducts}</div>
        <div className="text-sm text-muted-foreground">{t('totalProducts')}</div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-orange-600">
          {lowStockCount}
        </div>
        <div className="text-sm text-muted-foreground">{t('lowStock')}</div>
      </CardContent>
    </Card>
  </div>
  );
};

