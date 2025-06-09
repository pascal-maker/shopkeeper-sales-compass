
import { useState } from "react";
import { ArrowLeft, Banknote, Smartphone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PaymentSelectionProps {
  totalAmount: number;
  onSelectPayment: (paymentType: 'cash' | 'mobile-money' | 'credit') => void;
  onBack: () => void;
}

export const PaymentSelection = ({
  totalAmount,
  onSelectPayment,
  onBack
}: PaymentSelectionProps) => {
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'mobile-money' | 'credit'>('cash');

  const paymentOptions = [
    {
      id: 'cash' as const,
      label: 'Cash Payment',
      description: 'Payment in cash',
      icon: Banknote,
      color: 'text-green-600'
    },
    {
      id: 'mobile-money' as const,
      label: 'Mobile Money',
      description: 'M-Pesa, Airtel Money, etc.',
      icon: Smartphone,
      color: 'text-blue-600'
    },
    {
      id: 'credit' as const,
      label: 'Credit Sale',
      description: 'Pay later (requires customer)',
      icon: CreditCard,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Select Payment</h1>
          <p className="text-muted-foreground">Total: ${totalAmount}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedPayment}
            onValueChange={(value) => setSelectedPayment(value as typeof selectedPayment)}
            className="space-y-4"
          >
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Icon className={`h-6 w-6 ${option.color}`} />
                  <div className="flex-1">
                    <label htmlFor={option.id} className="font-medium text-lg cursor-pointer">
                      {option.label}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => onSelectPayment(selectedPayment)}
          className="flex-1"
          size="lg"
        >
          {selectedPayment === 'credit' ? 'Select Customer' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
