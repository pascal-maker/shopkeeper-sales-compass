
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerList } from "./customers/CustomerList";
import { AddCustomerForm } from "./customers/AddCustomerForm";
import { CustomerDetail } from "./customers/CustomerDetail";
import { Customer, CreditTransaction, CustomerWithCredit } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";
import { customerService } from "@/services/customerService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type View = 'list' | 'add' | 'detail' | 'edit';

export const CustomersManager = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for customers
  const { data: customers = [], isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
  });

  // Query for credit transactions
  const { data: creditTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['creditTransactions'],
    queryFn: customerService.getCreditTransactions,
  });

  // Mutation for adding customer
  const addCustomerMutation = useMutation({
    mutationFn: customerService.addCustomer,
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Customer Added",
        description: `${newCustomer.name} has been added successfully.`,
      });
      setCurrentView('list');
    },
    onError: (error) => {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating customer
  const updateCustomerMutation = useMutation({
    mutationFn: ({ customerId, updates }: { customerId: string; updates: Partial<Customer> }) =>
      customerService.updateCustomer(customerId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Customer Updated",
        description: "Customer information has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting customer
  const deleteCustomerMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      toast({
        title: "Customer Deleted",
        description: "Customer and all associated transactions have been removed.",
      });
      setCurrentView('list');
    },
    onError: (error) => {
      console.error('Error deleting customer:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Mutation for adding credit transaction
  const addCreditTransactionMutation = useMutation({
    mutationFn: customerService.addCreditTransaction,
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      toast({
        title: transaction.type === 'sale' ? "Credit Sale Recorded" : "Payment Recorded",
        description: `Transaction of $${transaction.amount} has been recorded.`,
      });
    },
    onError: (error) => {
      console.error('Error adding credit transaction:', error);
      toast({
        title: "Error",
        description: "Failed to record transaction. Please try again.",
        variant: "destructive",
      });
    }
  });

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => {
    addCustomerMutation.mutate(customerData);
  };

  const updateCustomer = (customerId: string, updates: Partial<Customer>) => {
    updateCustomerMutation.mutate({ customerId, updates });
  };

  const deleteCustomer = (customerId: string) => {
    deleteCustomerMutation.mutate(customerId);
  };

  const addCreditTransaction = (transaction: Omit<CreditTransaction, 'id' | 'synced'>) => {
    addCreditTransactionMutation.mutate(transaction);
  };

  const getCustomerCredit = (customerId: string): number => {
    const customerTransactions = creditTransactions.filter(t => t.customerId === customerId);
    const totalSales = customerTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = customerTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return totalSales - totalPayments;
  };

  const getCustomersWithCredit = (): CustomerWithCredit[] => {
    return customers.map(customer => {
      const customerTransactions = creditTransactions.filter(t => t.customerId === customer.id);
      const lastCreditSale = customerTransactions
        .filter(t => t.type === 'sale')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const lastPayment = customerTransactions
        .filter(t => t.type === 'payment')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return {
        ...customer,
        totalCredit: getCustomerCredit(customer.id),
        lastCreditDate: lastCreditSale ? new Date(lastCreditSale.date) : undefined,
        lastPaymentDate: lastPayment ? new Date(lastPayment.date) : undefined
      };
    });
  };

  const filteredCustomers = getCustomersWithCredit().filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Show loading state
  if (customersLoading || transactionsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (customersError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading customers</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'add':
        return (
          <AddCustomerForm
            onSubmit={addCustomer}
            onCancel={() => setCurrentView('list')}
          />
        );
      case 'detail':
        return selectedCustomer ? (
          <CustomerDetail
            customer={selectedCustomer}
            creditTransactions={creditTransactions.filter(t => t.customerId === selectedCustomer.id)}
            totalCredit={getCustomerCredit(selectedCustomer.id)}
            onEdit={() => setCurrentView('edit')}
            onDelete={() => deleteCustomer(selectedCustomer.id)}
            onAddTransaction={addCreditTransaction}
            onBack={() => setCurrentView('list')}
          />
        ) : null;
      case 'edit':
        return selectedCustomer ? (
          <AddCustomerForm
            customer={selectedCustomer}
            onSubmit={(data) => updateCustomer(selectedCustomer.id, data)}
            onCancel={() => setCurrentView('detail')}
            isEditing={true}
          />
        ) : null;
      case 'list':
      default:
        return (
          <>
            {/* Header */}
            <div className="bg-card border-b border-border px-4 py-4">
              <h1 className="text-2xl font-bold mb-4">Your Customers</h1>
              
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Add Customer Button */}
              <Button 
                onClick={() => setCurrentView('add')}
                className="w-full"
                size="lg"
                disabled={addCustomerMutation.isPending}
              >
                <Plus className="h-5 w-5 mr-2" />
                {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
              </Button>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-auto">
              <CustomerList
                customers={filteredCustomers}
                onSelectCustomer={(customer) => {
                  setSelectedCustomer(customer);
                  setCurrentView('detail');
                }}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {renderCurrentView()}
    </div>
  );
};
