
import { useState, useEffect } from "react";
import { ShoppingCart, User, Calendar, ArrowLeft, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sale } from "./SalesEntry";

interface SalesHistoryProps {
  onBack?: () => void;
}

export const SalesHistory = ({ onBack }: SalesHistoryProps) => {
  const [sales, setSales] = useState<(Sale & { id: number; synced: boolean })[]>([]);

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

  const getTotalRevenue = () => {
    return sales.reduce((total, sale) => total + sale.total, 0);
  };

  const getTodaysSales = () => {
    const today = new Date().toDateString();
    return sales.filter(sale => new Date(sale.timestamp).toDateString() === today);
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

  const todaysSales = getTodaysSales();

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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
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
                  <p className="text-sm text-muted-foreground">Today's Sales</p>
                  <p className="text-2xl font-bold">{todaysSales.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No sales yet</h3>
                <p className="text-muted-foreground">Start making sales to see them here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
