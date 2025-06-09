
import { TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DailyReportSummary = () => {
  const todayStats = {
    totalSales: 1250,
    transactions: 32,
    topProduct: "Coca Cola 500ml",
    topProductSold: 18
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Today's Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-green-800">${todayStats.totalSales}</div>
                <div className="text-sm text-green-600">Total Sales</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-blue-800">{todayStats.transactions}</div>
                <div className="text-sm text-blue-600">Transactions</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Top Selling Product</div>
            <div className="font-medium">{todayStats.topProduct}</div>
            <div className="text-sm text-primary">{todayStats.topProductSold} units sold</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
