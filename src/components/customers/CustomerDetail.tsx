
import { useState } from "react";
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, Calendar, MapPin, Phone, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Customer, CreditTransaction } from "@/types/customer";
import { PaymentForm } from "./PaymentForm";

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
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const sortedTransactions = [...creditTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
            <h1 className="text-xl font-semibold">{customer.name}</h1>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{customer.name}"? This will also remove all credit transactions. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
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
              Customer Information
              {!customer.synced && (
                <Badge variant="outline" className="text-xs">
                  Not Synced
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
              <span>Added {formatDate(customer.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Credit Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Credit Status
              {totalCredit > 0 && (
                <Button onClick={() => setShowPaymentForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Record Payment
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
                  ${Math.abs(totalCredit).toFixed(2)}
                </span>
              </div>
              <p className="text-muted-foreground">
                {totalCredit > 0 ? 'Outstanding Credit' : 'No Outstanding Credit'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
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
                          {transaction.type === 'sale' ? 'Credit Sale' : 'Payment'}
                        </Badge>
                        {!transaction.synced && (
                          <Badge variant="outline" className="text-xs">
                            Not Synced
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
                        {transaction.type === 'sale' ? '+' : '-'}${transaction.amount.toFixed(2)}
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
};
