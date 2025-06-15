
import { useState, useEffect } from "react";
import { ShoppingCart, User, Calendar, ArrowLeft, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sale } from "@/types/sales";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isAfter, isBefore } from "date-fns";

interface SalesHistoryProps {
  onBack?: () => void;
}

type FilterType = "week" | "month" | "custom";
const SALES_PER_PAGE = 15;

export const SalesHistory = ({ onBack }: SalesHistoryProps) => {
  const [sales, setSales] = useState<(Sale & { id: number; synced: boolean })[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("week");
  const [customRange, setCustomRange] = useState<{ from?: Date; to?: Date }>({});
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const loadSales = () => {
      const existingSales = JSON.parse(localStorage.getItem('sales') || '[]');
      setSales(existingSales.reverse()); // Show newest first
    };

    loadSales();
    
    // Listen for storage changes to update when new sales are added
    const handleStorageChange = () => {
      loadSales();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Filtering ---
  // Determine the current date range based on selected filter
  let dateRange: { from: Date; to: Date } = (() => {
    const today = new Date();
    if (filterType === "week") {
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
    } else if (filterType === "month") {
      return { from: startOfMonth(today), to: endOfMonth(today) };
    } else if (filterType === "custom" && customRange.from && customRange.to) {
      return { from: customRange.from, to: customRange.to };
    } else {
      // Fallback to week if custom unset
      return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
    }
  })();

  // Filter sales based on selected date range
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.timestamp);
    // Inclusive interval
    return isAfter(saleDate, addDays(dateRange.from, -1)) && isBefore(saleDate, addDays(dateRange.to, 1));
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredSales.length / SALES_PER_PAGE);
  const paginatedSales = filteredSales.slice((currentPage - 1) * SALES_PER_PAGE, currentPage * SALES_PER_PAGE);

  // When filter changes, reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, customRange]);

  const getTotalRevenue = () => {
    return filteredSales.reduce((total, sale) => total + sale.total, 0);
  };

  const getPaymentBadgeColor = (paymentType: string) => {
    switch (paymentType) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'mobile-money':
        return 'bg-blue-100 text-blue-800';
      case 'credit':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'cash':
        return 'Cash';
      case 'mobile-money':
        return 'Mobile Money';
      case 'credit':
        return 'Credit';
      default:
        return paymentType;
    }
  };

  // For summary cards, always use filteredSales for "Total Sales" and "Total Revenue"
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Sales History</h1>
            <p className="text-muted-foreground">Track all your completed sales</p>
          </div>
        </div>

        {/* Date Filter */}
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
              Showing {filteredSales.length} sale{filteredSales.length !== 1 && "s"} from{" "}
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

        {/* Summary Cards */}
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

        {/* Recent Sales with Pagination */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No sales in this period</h3>
                <p className="text-muted-foreground">Change your filter or start making sales to see them here</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedSales.map((sale) => (
                    <div key={sale.id} className="border rounded-lg p-4 space-y-3">
                      {/* Sale Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPaymentBadgeColor(sale.paymentType)}>
                              {getPaymentLabel(sale.paymentType)}
                            </Badge>
                            {!sale.synced && (
                              <Badge variant="outline" className="text-xs">
                                Offline
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(sale.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">${sale.total}</p>
                          <p className="text-sm text-muted-foreground">
                            {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      {sale.customer && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{sale.customer.name}</span>
                          <span className="text-sm text-muted-foreground">({sale.customer.phone})</span>
                        </div>
                      )}

                      {/* Items Summary */}
                      <div className="space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}× {item.name}</span>
                            <span>${item.quantity * item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
