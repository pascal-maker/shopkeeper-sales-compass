
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerList } from "./customers/CustomerList";
import { CustomerListHeader } from "./customers/CustomerListHeader";
import { AddCustomerForm } from "./customers/AddCustomerForm";
import { CustomerDetail } from "./customers/CustomerDetail";
import { CustomerLoadingError } from "./customers/CustomerLoadingError";
import { Customer } from "@/types/customer";
import { useCustomerOperations } from "@/hooks/useCustomerOperations";
import { useCustomerData } from "@/hooks/useCustomerData";

type View = 'list' | 'add' | 'detail' | 'edit';

export const CustomersManager = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    customers,
    creditTransactions,
    customersLoading,
    transactionsLoading,
    customersError,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCreditTransaction,
    getCustomerCredit,
    addCustomerMutation,
    queryClient
  } = useCustomerOperations();

  const { getFilteredCustomers } = useCustomerData(customers, creditTransactions, getCustomerCredit);

  const filteredCustomers = getFilteredCustomers(searchTerm);

  // Show loading or error state
  const loadingErrorComponent = (
    <CustomerLoadingError
      isLoading={customersLoading || transactionsLoading}
      error={customersError}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
    />
  );

  if (customersLoading || transactionsLoading || customersError) {
    return loadingErrorComponent;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'add':
        return (
          <AddCustomerForm
            onSubmit={(data) => {
              addCustomer(data);
              setCurrentView('list');
            }}
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
            onSubmit={(data) => {
              updateCustomer(selectedCustomer.id, data);
              setCurrentView('detail');
            }}
            onCancel={() => setCurrentView('detail')}
            isEditing={true}
          />
        ) : null;
      case 'list':
      default:
        return (
          <div className="h-full flex flex-col">
            <CustomerListHeader
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddCustomer={() => setCurrentView('add')}
              isAddingCustomer={addCustomerMutation.isPending}
            />

            <div className="flex-1 min-h-0">
              <CustomerList
                customers={filteredCustomers}
                onSelectCustomer={(customer) => {
                  setSelectedCustomer(customer);
                  setCurrentView('detail');
                }}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {renderCurrentView()}
    </div>
  );
};
