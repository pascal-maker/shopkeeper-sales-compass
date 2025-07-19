import { CheckCircle, Plus, Share, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sale } from "@/types/sales";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

interface SaleSummaryProps {
  sale: Sale;
  onNewSale: () => void;
}

export const SaleSummary = ({ sale, onNewSale }: SaleSummaryProps) => {
  const { currency } = useSettings();
  const getPaymentBadgeColor = () => {
    switch (sale.paymentType) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'mobile-money':
        return 'bg-blue-100 text-blue-800';
      case 'credit':
        return 'bg-orange-100 text-orange-800';
    }
  };

  const getPaymentLabel = () => {
    switch (sale.paymentType) {
      case 'cash':
        return 'Cash';
      case 'mobile-money':
        return 'Mobile Money';
      case 'credit':
        return 'Credit';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-green-700">Sale Completed!</h1>
          <p className="text-muted-foreground">Transaction saved successfully</p>
        </div>
      </div>

      {/* Sale Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sale Summary</CardTitle>
            <Badge className={getPaymentBadgeColor()}>
              {getPaymentLabel()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">ITEMS SOLD</h4>
            {sale.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.price, currency)}
                  </div>
                </div>
                <span className="font-semibold">{formatCurrency(item.quantity * item.price, currency)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Total Amount</span>
              <span className="font-bold text-xl text-primary">{formatCurrency(sale.total, currency)}</span>
            </div>
          </div>

          {/* Customer (if credit) */}
          {sale.customer && (
            <div className="border-t pt-3">
              <h4 className="font-medium text-sm text-muted-foreground mb-2">CUSTOMER</h4>
              <div>
                <p className="font-medium">{sale.customer.name}</p>
                <p className="text-sm text-muted-foreground">{sale.customer.phone}</p>
                {sale.paymentType === 'credit' && (
                  <p className="text-sm text-orange-600 font-medium">
                    Amount due: {formatCurrency(sale.total, currency)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="border-t pt-3">
            <p className="text-sm text-muted-foreground">
              Completed: {sale.timestamp.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-blue-800 text-sm">
            📱 Sale saved locally. Will sync when internet is available.
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button onClick={onNewSale} className="w-full h-12" size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Start New Sale
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-10">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" className="h-10">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>
    </div>
  );
};
