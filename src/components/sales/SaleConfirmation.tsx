
import { ArrowLeft, Banknote, Smartphone, CreditCard, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CartItem } from "../SalesEntry";
import { Customer } from "@/types/customer";

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
  console.log('SaleConfirmation - Payment Type:', paymentType);
  console.log('SaleConfirmation - Customer:', customer);
  console.log('SaleConfirmation - Cart:', cart);
  console.log('SaleConfirmation - Total Amount:', totalAmount);

  const getPaymentIcon = () => {
    switch (paymentType) {
      case 'cash':
        return <Banknote className="h-5 w-5 text-green-600" />;
      case 'mobile-money':
        return <Smartphone className="h-5 w-5 text-blue-600" />;
      case 'credit':
        return <CreditCard className="h-5 w-5 text-orange-600" />;
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
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Confirm Sale</h1>
          <p className="text-muted-foreground">Review and complete your sale</p>
        </div>
      </div>

      {/* Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Items ({cart.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.quantity} × ${item.price}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${item.quantity * item.price}</p>
              </div>
            </div>
          ))}
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-lg text-primary">${totalAmount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {getPaymentIcon()}
            <span className="font-medium text-lg">{getPaymentLabel()}</span>
          </div>
        </CardContent>
      </Card>

      {/* Customer (if credit sale) */}
      {paymentType === 'credit' && customer && (
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-lg">{customer.name}</h4>
                <p className="text-muted-foreground">{customer.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning for Credit Sales */}
      {paymentType === 'credit' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-orange-800 text-sm">
              ⚠️ This is a credit sale. The customer owes ${totalAmount} and should pay later.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons - This section should ALWAYS render */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={handleConfirmClick} className="flex-1 h-12" size="lg">
          Complete Sale
        </Button>
      </div>
      
      {/* Debug info for credit sales */}
      {paymentType === 'credit' && (
        <div className="text-xs text-muted-foreground p-2 bg-gray-100 rounded">
          Debug: Payment Type = {paymentType}, Customer = {customer ? customer.name : 'No customer'}
        </div>
      )}
    </div>
  );
};
