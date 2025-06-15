
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, ShoppingCart, Calendar } from "lucide-react";
import { Sale } from "@/types/sales";

interface SalesHistorySummaryCardsProps {
  filteredSales: (Sale & { id: number; synced: boolean })[];
}

export const SalesHistorySummaryCards: React.FC<SalesHistorySummaryCardsProps> = ({
  filteredSales,
}) => {
  const getTotalRevenue = () => {
    return filteredSales.reduce((total, sale) => total + sale.total, 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sales in Period</p>
              <p className="text-2xl font-bold">{filteredSales.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${getTotalRevenue()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-2xl font-bold">
                {
                  filteredSales.filter(s =>
                    new Date(s.timestamp).toDateString() === new Date().toDateString()
                  ).length
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
