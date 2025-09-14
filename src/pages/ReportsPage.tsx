
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { ChartBar, ChartPie } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/contexts/SettingsContext";

// Default data for when no sales exist
const defaultSalesTrendsData = [
  { date: "2025-09-08", sales: 0 },
  { date: "2025-09-09", sales: 0 },
  { date: "2025-09-10", sales: 0 },
  { date: "2025-09-11", sales: 0 },
  { date: "2025-09-12", sales: 0 },
  { date: "2025-09-13", sales: 0 },
  { date: "2025-09-14", sales: 0 }
];

const defaultProductPerformanceData = [
  { name: "No Sales", units: 0 }
];

// Chart configuration will be created dynamically with translations

export default function ReportsPage() {
  const { t } = useSettings();
  const [trendType, setTrendType] = useState<"bar" | "line">("bar");
  const [salesTrendsData, setSalesTrendsData] = useState(defaultSalesTrendsData);
  const [productPerformanceData, setProductPerformanceData] = useState(defaultProductPerformanceData);
  const [loading, setLoading] = useState(true);

  // Create dynamic chart config with translations
  const dynamicChartConfig = {
    sales: {
      label: t('sales'),
      icon: ChartBar,
      color: "#2563eb"
    },
    units: {
      label: t('unitsSold'),
      icon: ChartPie,
      color: "#f59e42"
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Get sales data for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, sale_date')
        .gte('sale_date', sevenDaysAgo.toISOString())
        .order('sale_date', { ascending: true });

      if (salesError) {
        console.error('Error fetching sales data:', salesError);
        return;
      }

      // Process sales data by date
      const salesByDate = new Map();
      salesData?.forEach(sale => {
        if (sale.sale_date) {
          const date = new Date(sale.sale_date).toISOString().split('T')[0];
          const currentTotal = salesByDate.get(date) || 0;
          salesByDate.set(date, currentTotal + sale.total_amount);
        }
      });

      // Create sales trends data for the last 7 days
      const trendsData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        trendsData.push({
          date: dateStr,
          sales: salesByDate.get(dateStr) || 0
        });
      }
      setSalesTrendsData(trendsData);

      // Get product performance data
      const { data: productData, error: productError } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          products!inner(name)
        `)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (productError) {
        console.error('Error fetching product data:', productError);
        return;
      }

      // Process product performance data
      const productSales = new Map();
      productData?.forEach(item => {
        const productName = item.products?.name || 'Unknown';
        const currentUnits = productSales.get(productName) || 0;
        productSales.set(productName, currentUnits + item.quantity);
      });

      // Convert to array and sort by units sold
      const productPerformance = Array.from(productSales.entries())
        .map(([name, units]) => ({ name, units }))
        .sort((a, b) => b.units - a.units)
        .slice(0, 5); // Top 5 products

      if (productPerformance.length === 0) {
        setProductPerformanceData(defaultProductPerformanceData);
      } else {
        setProductPerformanceData(productPerformance);
      }

    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-0 sm:p-6 pt-6">
        <h2 className="text-2xl font-semibold mb-4">{t('businessReports')}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">{t('loadingReports')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-0 sm:p-6 pt-6">
      <h2 className="text-2xl font-semibold mb-4">{t('businessReports')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Trends Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <ChartBar className="w-5 h-5 text-primary" />
                {t('salesTrends')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-2">
            <div className="flex flex-row mb-3">
              <button
                className={`px-3 py-1 rounded-l-md border text-xs font-medium ${
                  trendType === "bar"
                    ? "bg-primary text-background border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
                onClick={() => setTrendType("bar")}
              >
                {t('bar')}
              </button>
              <button
                className={`px-3 py-1 rounded-r-md border text-xs font-medium -ml-px ${
                  trendType === "line"
                    ? "bg-primary text-background border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
                onClick={() => setTrendType("line")}
              >
                {t('line')}
              </button>
            </div>
            <ChartContainer config={dynamicChartConfig}>
              {trendType === "bar" ? (
                <BarChart data={salesTrendsData} width={545} height={240}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip content={<ChartTooltipContent nameKey="sales" />} />
                  <Legend content={<ChartLegendContent nameKey="sales" />} />
                  <Bar dataKey="sales" fill="#2563eb" />
                </BarChart>
              ) : (
                <LineChart data={salesTrendsData} width={545} height={240}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip content={<ChartTooltipContent nameKey="sales" />} />
                  <Legend content={<ChartLegendContent nameKey="sales" />} />
                  <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot />
                </LineChart>
              )}
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Product Performance Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <ChartPie className="w-5 h-5 text-orange-500" />
                {t('productPerformance')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-2">
            <ChartContainer config={dynamicChartConfig}>
              <BarChart data={productPerformanceData} width={545} height={240} margin={{top: 10, right: 10, left: 10, bottom: 10}}>
                <CartesianGrid strokeDasharray="2 2" />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                <Tooltip content={<ChartTooltipContent nameKey="units" />} />
                <Legend content={<ChartLegendContent nameKey="units" />} />
                <Bar dataKey="units" fill="#f59e42" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
