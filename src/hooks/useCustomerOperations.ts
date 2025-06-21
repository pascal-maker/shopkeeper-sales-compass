import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Customer, CreditTransaction } from "@/types/customer";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";

export const useCustomerOperations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for customers - try Supabase first, fallback to localStorage
  const { data: customers = [], isLoading: customersLoading, error: customersError } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        return await customerService.getCustomers();
      } catch (error) {
        console.log('Failed to fetch from Supabase, using localStorage:', error);
        // Fallback to localStorage
        const localCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
        return localCustomers.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }));
      }
    },
  });

  // Query for credit transactions - try Supabase first, fallback to localStorage
  const { data: creditTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['creditTransactions'],
    queryFn: async () => {
      try {
        return await customerService.getCreditTransactions();
      } catch (error) {
        console.log('Failed to fetch credit transactions from Supabase, using localStorage:', error);
        // Fallback to localStorage
        const localTransactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
        return localTransactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        }));
      }
    },
  });

  // Mutation for adding customer
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => {
      // First save to localStorage
      const newCustomer: Customer = {
        ...customerData,
        id: `local_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        synced: false
      };

      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      existingCustomers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(existingCustomers));

      // Try to save to Supabase
      try {
        const supabaseCustomer = await customerService.addCustomer(customerData);
        
        // Update localStorage with Supabase ID and mark as synced
        const updatedCustomers = existingCustomers.map((c: any) => 
          c.id === newCustomer.id 
            ? { ...supabaseCustomer, synced: true }
            : c
        );
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
        
        return supabaseCustomer;
      } catch (error) {
        console.log('Failed to save to Supabase, customer saved locally:', error);
        return newCustomer;
      }
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      window.dispatchEvent(new Event('storage'));
      toast({
        title: "Customer Added",
        description: `${newCustomer.name} has been added successfully.${!newCustomer.synced ? ' (Will sync when online)' : ''}`,
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
    mutationFn: async ({ customerId, updates }: { customerId: string; updates: Partial<Customer> }) => {
      // Update localStorage first
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const updatedCustomers = existingCustomers.map((c: any) => {
        if (c.id === customerId) {
          return {
            ...c,
            ...updates,
            updatedAt: new Date(),
            synced: false // Mark as unsynced until Supabase update succeeds
          };
        }
        return c;
      });
      localStorage.setItem('customers', JSON.stringify(updatedCustomers));

      // Try to update in Supabase
      try {
        const supabaseCustomer = await customerService.updateCustomer(customerId, updates);
        
        // Mark as synced in localStorage
        const syncedCustomers = updatedCustomers.map((c: any) => 
          c.id === customerId ? { ...c, synced: true } : c
        );
        localStorage.setItem('customers', JSON.stringify(syncedCustomers));
        
        return supabaseCustomer;
      } catch (error) {
        console.log('Failed to update in Supabase, changes saved locally:', error);
        return updatedCustomers.find((c: any) => c.id === customerId);
      }
    },
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      window.dispatchEvent(new Event('storage'));
      toast({
        title: "Customer Updated",
        description: `Customer information has been updated successfully.${!updatedCustomer?.synced ? ' (Will sync when online)' : ''}`,
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
    mutationFn: async (customerId: string) => {
      // Remove from localStorage
      const existingCustomers = JSON.parse(localStorage.getItem('customers') || '[]');
      const filteredCustomers = existingCustomers.filter((c: any) => c.id !== customerId);
      localStorage.setItem('customers', JSON.stringify(filteredCustomers));

      // Remove credit transactions
      const existingTransactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
      const filteredTransactions = existingTransactions.filter((t: any) => t.customerId !== customerId);
      localStorage.setItem('creditTransactions', JSON.stringify(filteredTransactions));

      // Try to delete from Supabase
      try {
        await customerService.deleteCustomer(customerId);
      } catch (error) {
        console.log('Failed to delete from Supabase, removed locally:', error);
        // Keep local deletion even if Supabase fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      window.dispatchEvent(new Event('storage'));
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
    mutationFn: async (transaction: Omit<CreditTransaction, 'id' | 'synced'>) => {
      // Save to localStorage first
      const newTransaction: CreditTransaction & { synced: boolean } = {
        ...transaction,
        id: `local_${Date.now()}`,
        synced: false
      };

      const existingTransactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
      existingTransactions.push(newTransaction);
      localStorage.setItem('creditTransactions', JSON.stringify(existingTransactions));

      // Try to save to Supabase
      try {
        const supabaseTransaction = await customerService.addCreditTransaction(transaction);
        
        // Update localStorage with Supabase ID and mark as synced
        const updatedTransactions = existingTransactions.map((t: any) => 
          t.id === newTransaction.id 
            ? { ...supabaseTransaction, synced: true }
            : t
        );
        localStorage.setItem('creditTransactions', JSON.stringify(updatedTransactions));
        
        return supabaseTransaction;
      } catch (error) {
        console.log('Failed to save credit transaction to Supabase, saved locally:', error);
        return newTransaction;
      }
    },
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: ['creditTransactions'] });
      window.dispatchEvent(new Event('storage'));
      toast({
        title: transaction.type === 'sale' ? "Credit Sale Recorded" : "Payment Recorded",
        description: `Transaction of $${transaction.amount} has been recorded.${!transaction.synced ? ' (Will sync when online)' : ''}`,
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
