
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegendContent, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { ChartBar, ChartPie } from "lucide-react";

const salesTrendsData = [
  { date: "2025-06-01", sales: 450 },
  { date: "2025-06-02", sales: 510 },
  { date: "2025-06-03", sales: 600 },
  { date: "2025-06-04", sales: 420 },
  { date: "2025-06-05", sales: 700 },
  { date: "2025-06-06", sales: 670 },
  { date: "2025-06-07", sales: 722 }
];

const productPerformanceData = [
  { name: "Soap", units: 128 },
  { name: "Detergent", units: 87 },
  { name: "Cereal", units: 75 },
  { name: "Chips", units: 62 },
  { name: "Toothpaste", units: 49 }
];

const chartConfig = {
  sales: {
    label: "Sales",
    icon: ChartBar,
    color: "#2563eb"
  },
  units: {
    label: "Units Sold",
    icon: ChartPie,
    color: "#f59e42"
  }
};

export default function ReportsPage() {
  const [trendType, setTrendType] = useState<"bar" | "line">("bar");
  return (
    <div className="min-h-screen bg-background p-0 sm:p-6 pt-6">
      <h2 className="text-2xl font-semibold mb-4">Business Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Trends Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <ChartBar className="w-5 h-5 text-primary" />
                Sales Trends
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
                Bar
              </button>
              <button
                className={`px-3 py-1 rounded-r-md border text-xs font-medium -ml-px ${
                  trendType === "line"
                    ? "bg-primary text-background border-primary"
                    : "bg-muted text-muted-foreground border-border"
                }`}
                onClick={() => setTrendType("line")}
              >
                Line
              </button>
            </div>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={240}>
                {trendType === "bar" ? (
                  <BarChart data={salesTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip content={<ChartTooltipContent nameKey="sales" />} />
                    <Legend content={<ChartLegendContent nameKey="sales" />} />
                    <Bar dataKey="sales" fill="#2563eb" />
                  </BarChart>
                ) : (
                  <LineChart data={salesTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip content={<ChartTooltipContent nameKey="sales" />} />
                    <Legend content={<ChartLegendContent nameKey="sales" />} />
                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Product Performance Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <ChartPie className="w-5 h-5 text-orange-500" />
                Product Performance
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 pt-2">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={productPerformanceData} margin={{top: 10, right: 10, left: 10, bottom: 10}}>
                  <CartesianGrid strokeDasharray="2 2" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis tick={{fontSize: 12}} allowDecimals={false} />
                  <Tooltip content={<ChartTooltipContent nameKey="units" />} />
                  <Legend content={<ChartLegendContent nameKey="units" />} />
                  <Bar dataKey="units" fill="#f59e42" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
