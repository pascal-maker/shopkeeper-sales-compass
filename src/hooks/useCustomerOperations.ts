
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Customer, CreditTransaction } from "@/types/customer";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";

export const useCustomerOperations = () => {
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

  return {
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
  };
};
