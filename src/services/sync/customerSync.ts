
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { SyncResult } from "./types";

export const customerSync = {
  async syncCustomers(): Promise<SyncResult> {
    console.log('CustomerSync: Syncing customers...');
    const customers: Customer[] = JSON.parse(localStorage.getItem('customers') || '[]').map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt)
    }));

    const unsyncedCustomers = customers.filter(c => !c.synced);
    if (unsyncedCustomers.length === 0) {
      return { success: true, errors: [], synced: 0 };
    }

    const errors: string[] = [];
    let synced = 0;

    for (const customer of unsyncedCustomers) {
      try {
        // Check if customer already exists
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', customer.phone)
          .maybeSingle();

        if (!existingCustomer) {
          // Create new customer
          const { error } = await supabase
            .from('customers')
            .insert({
              name: customer.name,
              phone: customer.phone,
              location: customer.location || null,
              notes: customer.notes || null,
              sync_status: 'synced'
            });

          if (error) {
            errors.push(`Failed to sync customer ${customer.name}: ${error.message}`);
            continue;
          }
        }

        // Mark as synced in localStorage
        const updatedCustomers = customers.map(c => 
          c.id === customer.id ? { ...c, synced: true } : c
        );
        localStorage.setItem('customers', JSON.stringify(updatedCustomers));
        synced++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync customer ${customer.name}: ${errorMsg}`);
      }
    }

    return { success: errors.length === 0, errors, synced };
  },

  async pullCustomers(): Promise<{ customers: any[], errors: string[] }> {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) {
        return { customers: [], errors: [`Failed to pull customers: ${customersError.message}`] };
      }

      if (customersData) {
        const localCustomers = customersData.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          location: c.location || undefined,
          notes: c.notes || undefined,
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
          synced: true
        }));
        return { customers: localCustomers, errors: [] };
      }

      return { customers: [], errors: [] };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { customers: [], errors: [errorMsg] };
    }
  }
};
