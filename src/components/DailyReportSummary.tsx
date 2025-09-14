
import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

type TopProduct = { name: string; sold: number };

function getStartOfTodayUTC() {
  // Returns start of today in UTC for sale_date filtering
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
}
function getStartOfWeekUTC() {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  now.setUTCDate(now.getUTCDate() - (day - 1));
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
}

export const DailyReportSummary = () => {
  const { currency, t } = useSettings();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalSales: number;
    transactions: number;
    topProducts: TopProduct[];
  }>({
    totalSales: 0,
    transactions: 0,
    topProducts: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);

      // Guard: fail fast if no supabase
      if (!supabase) {
        setError("Supabase client not available");
        setLoading(false);
        return;
      }

      try {
        // 1. Today's Sales Stats
        const startOfToday = getStartOfTodayUTC().toISOString();
        const now = new Date().toISOString();

        // Fetch today's sales entries
        const { data: salesToday, error: salesErr } = await supabase
          .from("sales")
          .select("id,total_amount")
          .gte("sale_date", startOfToday)
          .lte("sale_date", now);

        if (salesErr) throw new Error(salesErr.message);

        const totalSales =
          salesToday?.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0) || 0;

        // 2. Transaction count (number of sales)
        const transactions = salesToday ? salesToday.length : 0;

        // 3. Weekly Top 3 Products
        // We want sales from start of week till now
        const startOfWeek = getStartOfWeekUTC().toISOString();

        // Fetch sale_items joined with product name
        const { data: items, error: itemsErr } = await supabase
          .from("sale_items")
          .select("quantity, product_id, products(name)")
          .gte("created_at", startOfWeek)
          .lte("created_at", now);

        if (itemsErr) throw new Error(itemsErr.message);

        // Aggregate by product name
        const productMap: Record<string, { name: string; sold: number }> = {};
        items?.forEach((item) => {
          const name = item.products?.name ?? "Unnamed Product";
          if (!productMap[name]) {
            productMap[name] = { name, sold: 0 };
          }
          productMap[name].sold += Number(item.quantity);
        });
        const topProducts = Object.values(productMap)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 3);

        setStats({
          totalSales,
          transactions,
          topProducts,
        });
      } catch (e: any) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    // Optionally auto update every 60s for real-timeness
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          {t('todayOverview')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">{t('loading')}</div>
        ) : error ? (
          <div className="text-center py-10 text-red-600">{t('error')}: {error}</div>
        ) : (
          <div className="space-y-3">
            {/* Total Sales Today */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-green-800">
                    {formatCurrency(stats.totalSales, currency)}
                  </div>
                  <div className="text-sm text-green-600">
                    {t('totalSales')}
                  </div>
                </div>
              </div>
            </div>
            {/* Transactions Count Today */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-800">{stats.transactions}</div>
                  <div className="text-sm text-blue-600">
                    {t('transactionsToday')}
                  </div>
                </div>
              </div>
            </div>
            {/* Top 3 Selling Products */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                {t('topSellingProducts')}
              </div>
              {stats.topProducts.length > 0 ? (
                <ol className="space-y-1">
                  {stats.topProducts.map((product, idx) => (
                    <li key={product.name} className="flex justify-between items-center">
                      <span className="font-medium">
                        {idx + 1}. {product.name}
                      </span>
                      <span className="text-sm text-primary">{product.sold} sold</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-sm italic text-muted-foreground">{t('noSalesThisWeek')}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
