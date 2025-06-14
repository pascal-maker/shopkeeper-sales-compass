import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerList } from "./customers/CustomerList";
import { AddCustomerForm } from "./customers/AddCustomerForm";
import { CustomerDetail } from "./customers/CustomerDetail";
import { Customer, CreditTransaction, CustomerWithCredit } from "@/types/customer";
import { useToast } from "@/hooks/use-toast";

type View = 'list' | 'add' | 'detail' | 'edit';

export const CustomersManager = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Load data from localStorage on component mount
  useEffect(() => {
    console.log('CustomersManager: Loading data from localStorage');
    
    const savedCustomers = localStorage.getItem('customers');
    const savedTransactions = localStorage.getItem('creditTransactions');
    
    if (savedCustomers) {
      try {
        const parsedCustomers = JSON.parse(savedCustomers);
        // Convert date strings back to Date objects
        const customersWithDates = parsedCustomers.map((customer: any) => ({
          ...customer,
          createdAt: new Date(customer.createdAt),
          updatedAt: new Date(customer.updatedAt)
        }));
        console.log('CustomersManager: Loaded customers:', customersWithDates);
        setCustomers(customersWithDates);
      } catch (error) {
        console.error('Error parsing customers from localStorage:', error);
      }
    }
    
    if (savedTransactions) {
      try {
        const parsedTransactions = JSON.parse(savedTransactions);
        // Convert date strings back to Date objects
        const transactionsWithDates = parsedTransactions.map((transaction: any) => ({
          ...transaction,
          date: new Date(transaction.date)
        }));
        console.log('CustomersManager: Loaded transactions:', transactionsWithDates);
        setCreditTransactions(transactionsWithDates);
      } catch (error) {
        console.error('Error parsing transactions from localStorage:', error);
      }
    }
  }, []);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    if (customers.length > 0) {
      console.log('CustomersManager: Saving customers to localStorage:', customers);
      localStorage.setItem('customers', JSON.stringify(customers));
    }
  }, [customers]);

  // Save credit transactions to localStorage whenever they change
  useEffect(() => {
    if (creditTransactions.length > 0) {
      console.log('CustomersManager: Saving transactions to localStorage:', creditTransactions);
      localStorage.setItem('creditTransactions', JSON.stringify(creditTransactions));
    }
  }, [creditTransactions]);

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false
    };

    console.log('CustomersManager: Adding new customer:', newCustomer);
    setCustomers(prev => {
      const updated = [...prev, newCustomer];
      console.log('CustomersManager: Updated customers list:', updated);
      return updated;
    });
    
    toast({
      title: "Customer Added",
      description: `${customerData.name} has been added successfully.`,
    });
    
    setCurrentView('list');
  };

  const updateCustomer = (customerId: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, ...updates, updatedAt: new Date(), synced: false }
        : customer
    ));
    
    toast({
      title: "Customer Updated",
      description: "Customer information has been updated successfully.",
    });
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    setCreditTransactions(prev => prev.filter(transaction => transaction.customerId !== customerId));
    
    toast({
      title: "Customer Deleted",
      description: "Customer and all associated transactions have been removed.",
    });
    
    setCurrentView('list');
  };

  const addCreditTransaction = (transaction: Omit<CreditTransaction, 'id' | 'synced'>) => {
    const newTransaction: CreditTransaction = {
      ...transaction,
      id: Date.now().toString(),
      synced: false
    };

    setCreditTransactions(prev => [...prev, newTransaction]);
    
    toast({
      title: transaction.type === 'sale' ? "Credit Sale Recorded" : "Payment Recorded",
      description: `Transaction of $${transaction.amount} has been recorded.`,
    });
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
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Customer
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
