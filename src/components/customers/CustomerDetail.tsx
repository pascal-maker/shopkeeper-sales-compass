
/**
 * CustomerDetail
 *
 * Displays a customer's profile, credit status, and transaction history.
 * Allows editing, deletion (with confirm), and recording payments.
 *
 * Improvement ideas:
 * - Memoize derived data like sorted transactions (useMemo) to avoid re-sorts on each render.
 * - Add loading/empty/sync states at the component boundary, not just inside the list.
 * - Enhance a11y: heading semantics, aria-live for updates, button labels, and focus management when PaymentForm opens.
 * - Consider virtualization if transaction history can be large.
 * - Consider server-side/React Query mutation for payment submission with optimistic updates.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, Calendar, MapPin, Phone, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Customer, CreditTransaction } from "@/types/customer";
import { PaymentForm } from "./PaymentForm";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

/** Props contract for CustomerDetail */
interface CustomerDetailProps {
  customer: Customer;
  creditTransactions: CreditTransaction[];
  totalCredit: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddTransaction: (transaction: Omit<CreditTransaction, 'id' | 'synced'>) => void;
  onBack: () => void;
}

export const CustomerDetail = ({ 
  customer, 
  creditTransactions, 
  totalCredit, 
  onEdit, 
  onDelete, 
  onAddTransaction, 
  onBack 
}: CustomerDetailProps) => {
  const { currency, t } = useSettings();
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Memoize to prevent resorting on every render
  const sortedTransactions = useMemo(() => {
    return [...creditTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [creditTransactions]);

  // Localized short date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  /**
 * CustomerDetail props and setup
 *
 * Props:
 * - customer: the current customer's profile info
 * - creditTransactions: list of that customer's credit-related transactions
 * - totalCredit: total outstanding credit (positive => owes, zero => none)
 * - onEdit(): open edit flow for the customer
 * - onDelete(): delete the customer (confirm is handled in UI)
 * - onAddTransaction(tx): add a new transaction (e.g., payment)
 * - onBack(): navigate back to previous view
 *
 * State:
 * - showPaymentForm: toggles the payment form modal
 *
 * Derived data:
 * - sortedTransactions: memoized newest-first by date to avoid re-sorting on every render
 *
 * Helpers:
 * - formatDate(date): localized short date string for display
 */

  // Bubble up a payment transaction; consider optimistic update + server mutation
  const handlePaymentSubmit = (amount: number, notes?: string) => {
    onAddTransaction({
      customerId: customer.id,
      type: 'payment',
      amount,
      notes,
      date: new Date()
    });
    setShowPaymentForm(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {/* Improvement: ensure this is the page's main heading (h1) in context */}
            <h1 className="text-xl font-semibold">{customer.name}</h1>
          </div>
          
          <div className="flex gap-2">
            {/* Improvement: add aria-label (e.g., aria-label="Edit customer") */}
            <Button variant="outline" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                {/* Improvement: add aria-label and role description */}
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteCustomer')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteCustomerConfirm').replace('{name}', customer.name)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Customer Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t('customerInformation')}
              {!customer.synced && (
                <Badge variant="outline" className="text-xs">
                  {t('notSynced')}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone}</span>
            </div>
            
            {customer.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{customer.location}</span>
              </div>
            )}
            
            {customer.notes && (
              <div className="flex items-start gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-1" />
                <span className="text-sm">{customer.notes}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{t('added')} {formatDate(customer.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Credit Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t('creditStatus')}
              {totalCredit > 0 && (
                <Button onClick={() => setShowPaymentForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  {t('recordPayment')}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-6 w-6" />
                <span 
                  className={`text-3xl font-bold ${
                    totalCredit > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(Math.abs(totalCredit), currency)}
                </span>
              </div>
              <p className="text-muted-foreground">
                {totalCredit > 0 ? t('outstandingCredit') : t('noOutstandingCredit')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>{t('transactionHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noTransactionsYet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={transaction.type === 'sale' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {transaction.type === 'sale' ? t('creditSale') : t('payment')}
                        </Badge>
                        {!transaction.synced && (
                          <Badge variant="outline" className="text-xs">
                            {t('notSynced')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                      {transaction.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <span 
                        className={`font-semibold ${
                          transaction.type === 'sale' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <PaymentForm
          customerName={customer.name}
          outstandingAmount={totalCredit}
          onSubmit={handlePaymentSubmit}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}
    </div>
  );
  // Payment Form Modal
// - Renders PaymentForm as a modal when showPaymentForm is true
// - Passes:
//   • customerName: for display context in the form header
//   • outstandingAmount: used to show/validate remaining balance
//   • onSubmit: handles successful payment submission (adds a transaction)
//   • onCancel: closes the modal by setting showPaymentForm to false
};
