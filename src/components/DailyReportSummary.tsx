
import { TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mocked weekly top products data (replace with query in the future)
const topProductsOfWeek = [
  { name: "Coca Cola 500ml", sold: 37 },
  { name: "Fanta 330ml", sold: 25 },
  { name: "Sprite 500ml", sold: 21 }
];

export const DailyReportSummary = () => {
  const todayStats = {
    totalSales: 1250,
    transactions: 32
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Insight
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
                <div className="text-sm text-green-600">Total Sales Today</div>
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
                <div className="text-sm text-blue-600">Transactions Today</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Top 3 Selling Products This Week</div>
            <ol className="space-y-1">
              {topProductsOfWeek.map((product, idx) => (
                <li key={product.name} className="flex justify-between items-center">
                  <span className="font-medium">{idx + 1}. {product.name}</span>
                  <span className="text-sm text-primary">{product.sold} sold</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
