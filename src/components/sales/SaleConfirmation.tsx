import { ArrowLeft, Banknote, Smartphone, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem } from "@/types/sales";
import { Customer } from "@/types/customer";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

interface SaleConfirmationProps {
  cart: CartItem[];
  totalAmount: number;
  paymentType: 'cash' | 'mobile-money' | 'credit';
  customer?: Customer;
  onConfirm: () => void;
  onBack: () => void;
}

export const SaleConfirmation = ({
  cart,
  totalAmount,
  paymentType,
  customer,
  onConfirm,
  onBack
}: SaleConfirmationProps) => {
  const { currency } = useSettings();
  console.log('SaleConfirmation - Payment Type:', paymentType);
  console.log('SaleConfirmation - Customer:', customer);
  console.log('SaleConfirmation - Cart:', cart);
  console.log('SaleConfirmation - Total Amount:', totalAmount);

  const getPaymentIcon = () => {
    switch (paymentType) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'mobile-money':
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      case 'credit':
        return <CreditCard className="h-4 w-4 text-orange-600" />;
    }
  };

  const getPaymentLabel = () => {
    switch (paymentType) {
      case 'cash':
        return 'Cash Payment';
      case 'mobile-money':
        return 'Mobile Money';
      case 'credit':
        return 'Credit Sale';
    }
  };

  const handleConfirmClick = () => {
    console.log('Confirm button clicked - Payment Type:', paymentType);
    console.log('Confirm button clicked - Customer:', customer);
    onConfirm();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Confirm Sale</h1>
            <p className="text-sm text-muted-foreground">Review and complete your sale</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 pb-24">
          {/* Items Summary - Condensed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Items ({cart.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {formatCurrency(item.price, currency)}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-semibold text-sm">{formatCurrency(item.quantity * item.price, currency)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-bold text-primary">{formatCurrency(totalAmount, currency)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method - Condensed */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex items-center gap-3">
                {getPaymentIcon()}
                <span className="font-medium">{getPaymentLabel()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer (if credit sale) - Condensed */}
          {paymentType === 'credit' && customer && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Customer</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{customer.name}</h4>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning for Credit Sales - Condensed */}
          {paymentType === 'credit' && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <p className="text-orange-800 text-sm">
                  ⚠️ This is a credit sale. The customer owes {formatCurrency(totalAmount, currency)} and should pay later.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Debug info for credit sales */}
          {paymentType === 'credit' && (
            <div className="text-xs text-muted-foreground p-2 bg-gray-100 rounded">
              Debug: Payment Type = {paymentType}, Customer = {customer ? customer.name : 'No customer'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Fixed Action Buttons at Bottom */}
      <div className="sticky bottom-0 z-10 bg-background border-t p-4">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={handleConfirmClick} className="flex-1 h-12" size="lg">
            Complete Sale
          </Button>
        </div>
      </div>
    </div>
  );
};
