
import { supabase } from "@/integrations/supabase/client";
import { Customer, CreditTransaction } from "@/types/customer";
import { handleSupabaseError } from "@/utils/errorHandling";

export const customerService = {
  // Customer operations
  async getCustomers(userId: string): Promise<Customer[]> {
    console.log('CustomerService: Fetching customers from Supabase for user:', userId);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('CustomerService: Error fetching customers:', error);
      const safeError = handleSupabaseError(error);
      throw new Error(safeError.message);
    }

    console.log('CustomerService: Fetched customers:', data);
    return data.map(customer => ({
      ...customer,
      createdAt: new Date(customer.created_at),
      updatedAt: new Date(customer.updated_at),
      synced: customer.sync_status === 'synced'
    }));
  },

  async addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'synced'>, userId: string): Promise<Customer> {
    console.log('CustomerService: Adding customer to Supabase:', customerData, 'for user:', userId);
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customerData.name,
        phone: customerData.phone,
        location: customerData.location,
        notes: customerData.notes,
        user_id: userId,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (error) {
      console.error('CustomerService: Error adding customer:', error);
      const safeError = handleSupabaseError(error);
      throw new Error(safeError.message);
    }

    console.log('CustomerService: Added customer:', data);
    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      synced: data.sync_status === 'synced'
    };
  },

  async updateCustomer(customerId: string, updates: Partial<Customer>, userId: string): Promise<Customer> {
    console.log('CustomerService: Updating customer:', customerId, updates, 'for user:', userId);
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: updates.name,
        phone: updates.phone,
        location: updates.location,
        notes: updates.notes,
        sync_status: 'synced'
      })
      .eq('id', customerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('CustomerService: Error updating customer:', error);
      const safeError = handleSupabaseError(error);
      throw new Error(safeError.message);
    }

    console.log('CustomerService: Updated customer:', data);
    return {
      ...data,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      synced: data.sync_status === 'synced'
    };
  },

  async deleteCustomer(customerId: string, userId: string): Promise<void> {
    console.log('CustomerService: Deleting customer:', customerId, 'for user:', userId);
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('user_id', userId);

    if (error) {
      console.error('CustomerService: Error deleting customer:', error);
      const safeError = handleSupabaseError(error);
      throw new Error(safeError.message);
    }

    console.log('CustomerService: Deleted customer:', customerId);
  },

  // Credit transaction operations
  async getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    console.log('CustomerService: Fetching credit transactions from Supabase for user:', userId);
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('CustomerService: Error fetching credit transactions:', error);
      const safeError = handleSupabaseError(error);
      throw new Error(safeError.message);
    }

    console.log('CustomerService: Fetched credit transactions:', data);
    return data.map(transaction => ({
      id: transaction.id,
      customerId: transaction.customer_id,
      type: transaction.transaction_type as 'sale' | 'payment',
      amount: Number(transaction.amount),
      notes: transaction.notes,
      date: new Date(transaction.transaction_date),
      synced: transaction.sync_status === 'synced'
    }));
  },

  async addCreditTransaction(transaction: Omit<CreditTransaction, 'id' | 'synced'>, userId: string): Promise<CreditTransaction> {
    console.log('CustomerService: Adding credit transaction to Supabase:', transaction, 'for user:', userId);
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        customer_id: transaction.customerId,
        transaction_type: transaction.type,
        amount: transaction.amount,
        notes: transaction.notes,
        transaction_date: transaction.date.toISOString(),
        user_id: userId,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (error) {
      console.error('CustomerService: Error adding credit transaction:', error);
      const safeError = handleSupabaseError(error);
      throw new Error(safeError.message);
    }

    console.log('CustomerService: Added credit transaction:', data);
    return {
      id: data.id,
      customerId: data.customer_id,
      type: data.transaction_type as 'sale' | 'payment',
      amount: Number(data.amount),
      notes: data.notes,
      date: new Date(data.transaction_date),
      synced: data.sync_status === 'synced'
    };
  }
};
