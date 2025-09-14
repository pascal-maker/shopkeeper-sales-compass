
import { useState } from "react";
import { DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

interface PaymentFormProps {
  customerName: string;
  outstandingAmount: number;
  onSubmit: (amount: number, notes?: string) => void;
  onCancel: () => void;
}
// Props for PaymentForm: display context and submit/cancel handlers
// - customerName: name shown in the dialog
// - outstandingAmount: current amount owed (used for display and validation)
// - onSubmit(amount, notes?): callback when user confirms payment
// - onCancel(): closes the form without saving
export const PaymentForm = ({ customerName, outstandingAmount, onSubmit, onCancel }: PaymentFormProps) => {
  const { currency, t } = useSettings();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  /**
 * handleSubmit
 * - Prevents default form submit.
 * - Parses amount -> number, validates > 0 and ≤ outstandingAmount.
 * - On success: calls onSubmit(paymentAmount, trimmed notes or undefined).
 * - Sets error message for invalid input cases.
 */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const paymentAmount = parseFloat(amount);
    
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      setError(t('paymentAmountRequired'));
      return;
    }
    
    if (paymentAmount > outstandingAmount) {
      setError(`${t('paymentCannotExceed')} ${formatCurrency(outstandingAmount, currency)}`);
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
            <CardTitle>{t('recordPayment')}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('recordingPaymentFor')} <strong>{customerName}</strong>
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Outstanding Amount Display */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('outstandingAmount')}:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(outstandingAmount, currency)}
                </span>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">{t('paymentAmount')} *</Label>
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
                  {t('fullPayment')}
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notesOptional')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                {t('cancel')}
              </Button>
              <Button type="submit" className="flex-1">
                {t('recordPayment')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
