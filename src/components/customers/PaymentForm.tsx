
import { useState } from "react";
import { DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentFormProps {
  customerName: string;
  outstandingAmount: number;
  onSubmit: (amount: number, notes?: string) => void;
  onCancel: () => void;
}

export const PaymentForm = ({ customerName, outstandingAmount, onSubmit, onCancel }: PaymentFormProps) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    
    if (paymentAmount > outstandingAmount) {
      setError(`Payment cannot exceed outstanding amount of $${outstandingAmount.toFixed(2)}`);
      return;
    }
    
    onSubmit(paymentAmount, notes.trim() || undefined);
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (error) setError('');
  };

  const setFullPayment = () => {
    setAmount(outstandingAmount.toFixed(2));
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Record Payment</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Recording payment for <strong>{customerName}</strong>
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Outstanding Amount Display */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding Amount:</span>
                <span className="font-semibold text-red-600">
                  ${outstandingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={outstandingAmount}
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className={`pl-10 ${error ? 'border-red-500' : ''}`}
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={setFullPayment}
                  className="text-xs"
                >
                  Full Payment
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Cash payment, partial payment..."
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Record Payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
