
import { User, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sale } from "@/types/sales";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

interface SalesListWithPaginationProps {
  paginatedSales: (Sale & { id: number; synced: boolean })[];
  filteredSalesLength: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  getPaymentBadgeColor: (paymentType: string) => string;
  getPaymentLabel: (paymentType: string) => string;
}

export const SalesListWithPagination: React.FC<SalesListWithPaginationProps> = ({
  paginatedSales,
  filteredSalesLength,
  totalPages,
  currentPage,
  setCurrentPage,
  getPaymentBadgeColor,
  getPaymentLabel,
}) => {
  const { t, currency } = useSettings();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('recentSales')}</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredSalesLength === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('noSalesInPeriod')}</h3>
            <p className="text-muted-foreground">{t('changeFilterOrStartSales')}</p>
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
                      <p className="text-2xl font-bold text-primary">{formatCurrency(sale.total, currency)}</p>
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
                        <span>{formatCurrency(item.quantity * item.price, currency)}</span>
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
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
