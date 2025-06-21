
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/services/inventoryService";
import { Customer, CreditTransaction } from "@/types/customer";
import { Sale } from "@/types/sales";

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSyncs: number;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  errors: string[];
  synced: number;
}

class SyncService {
  private syncInProgress = false;
  private syncCallbacks: ((status: SyncStatus) => void)[] = [];

  // Subscribe to sync status changes
  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifySyncStatusChange(status: SyncStatus) {
    this.syncCallbacks.forEach(callback => callback(status));
  }

  // Check if we're online and can sync
  async checkConnectivity(): Promise<boolean> {
    try {
      const { error } = await supabase.from('products').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Get current sync status
  async getSyncStatus(): Promise<SyncStatus> {
    const isOnline = await this.checkConnectivity();
    const lastSyncStr = localStorage.getItem('lastSync');
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;
    
    // Count pending items
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const creditTransactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
    
    const pendingProducts = products.filter((p: any) => !p.synced).length;
    const pendingCustomers = customers.filter((c: any) => !c.synced).length;
    const pendingSales = sales.filter((s: any) => !s.synced).length;
    const pendingTransactions = creditTransactions.filter((t: any) => !t.synced).length;
    const pendingSyncs = pendingProducts + pendingCustomers + pendingSales + pendingTransactions;

    return {
      isOnline,
      lastSync,
      pendingSyncs,
      errors: JSON.parse(localStorage.getItem('syncErrors') || '[]')
    };
  }

  // Sync all data
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, errors: ['Sync already in progress'], synced: 0 };
    }

    this.syncInProgress = true;
    const errors: string[] = [];
    let totalSynced = 0;

    try {
      console.log('SyncService: Starting full sync...');
      
      // Check connectivity first
      const isOnline = await this.checkConnectivity();
      if (!isOnline) {
        return { success: false, errors: ['No internet connection'], synced: 0 };
      }

      // Sync in dependency order: Products -> Customers -> Sales -> Credit Transactions
      const productsResult = await this.syncProducts();
      if (!productsResult.success) {
        errors.push(...productsResult.errors);
      } else {
        totalSynced += productsResult.synced;
      }

      const customersResult = await this.syncCustomers();
      if (!customersResult.success) {
        errors.push(...customersResult.errors);
      } else {
        totalSynced += customersResult.synced;
      }

      const salesResult = await this.syncSales();
      if (!salesResult.success) {
        errors.push(...salesResult.errors);
      } else {
        totalSynced += salesResult.synced;
      }

      const transactionsResult = await this.syncCreditTransactions();
      if (!transactionsResult.success) {
        errors.push(...transactionsResult.errors);
      } else {
        totalSynced += transactionsResult.synced;
      }

      // Update last sync time
      localStorage.setItem('lastSync', new Date().toISOString());
      
      // Store sync errors
      localStorage.setItem('syncErrors', JSON.stringify(errors));

      const result = { success: errors.length === 0, errors, synced: totalSynced };
      
      // Notify status change
      const status = await this.getSyncStatus();
      this.notifySyncStatusChange(status);

      console.log('SyncService: Full sync completed', result);
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('SyncService: Sync failed:', errorMsg);
      return { success: false, errors: [errorMsg], synced: totalSynced };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync products to Supabase
  private async syncProducts(): Promise<SyncResult> {
    console.log('SyncService: Syncing products...');
    const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]').map((p: any) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    }));

    const unsyncedProducts = products.filter(p => !p.synced);
    if (unsyncedProducts.length === 0) {
      return { success: true, errors: [], synced: 0 };
    }

    const errors: string[] = [];
    let synced = 0;

    for (const product of unsyncedProducts) {
      try {
        // Check if product already exists
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .maybeSingle();

        if (!existingProduct) {
          // Create new product
          const { error } = await supabase
            .from('products')
            .insert({
              name: product.name,
              selling_price: product.sellingPrice,
              cost_price: product.costPrice || null,
              quantity: product.quantity,
              unit_type: product.unitType || 'piece',
              category: product.category || null,
              sku: product.sku || null,
              expiry_date: product.expiryDate || null,
              sync_status: 'synced'
            });

          if (error) {
            errors.push(`Failed to sync product ${product.name}: ${error.message}`);
            continue;
          }
        }

        // Mark as synced in localStorage
        const updatedProducts = products.map(p => 
          p.id === product.id ? { ...p, synced: true } : p
        );
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        synced++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync product ${product.name}: ${errorMsg}`);
      }
    }

    return { success: errors.length === 0, errors, synced };
  }

  // Sync customers to Supabase
  private async syncCustomers(): Promise<SyncResult> {
    console.log('SyncService: Syncing customers...');
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
  }

  // Sync sales to Supabase
  private async syncSales(): Promise<SyncResult> {
    console.log('SyncService: Syncing sales...');
    const sales: (Sale & { id: number; synced: boolean })[] = JSON.parse(localStorage.getItem('sales') || '[]').map((s: any) => ({
      ...s,
      timestamp: new Date(s.timestamp)
    }));

    const unsyncedSales = sales.filter(s => !s.synced);
    if (unsyncedSales.length === 0) {
      return { success: true, errors: [], synced: 0 };
    }

    const errors: string[] = [];
    let synced = 0;

    for (const sale of unsyncedSales) {
      try {
        // Map payment type
        const paymentTypeMap = {
          'mobile-money': 'mobile_money' as const,
          'cash': 'cash' as const,
          'credit': 'credit' as const
        };

        // Create sale
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            total_amount: sale.total,
            payment_type: paymentTypeMap[sale.paymentType],
            customer_id: sale.customer?.id || null,
            sale_date: sale.timestamp.toISOString(),
            sync_status: 'synced'
          })
          .select()
          .single();

        if (saleError) {
          errors.push(`Failed to sync sale: ${saleError.message}`);
          continue;
        }

        // Create sale items
        const saleItemsPromises = sale.items.map(async (item) => {
          // Find product ID in Supabase by name
          const { data: productData } = await supabase
            .from('products')
            .select('id')
            .eq('name', item.name)
            .maybeSingle();

          if (!productData) {
            throw new Error(`Product "${item.name}" not found in database`);
          }

          return {
            sale_id: saleData.id,
            product_id: productData.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.quantity * item.price,
            sync_status: 'synced' as const
          };
        });

        const saleItems = await Promise.all(saleItemsPromises);
        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) {
          errors.push(`Failed to sync sale items: ${itemsError.message}`);
          continue;
        }

        // If credit sale, create credit transaction
        if (sale.paymentType === 'credit' && sale.customer) {
          const { error: creditError } = await supabase
            .from('credit_transactions')
            .insert({
              customer_id: sale.customer.id,
              sale_id: saleData.id,
              transaction_type: 'sale',
              amount: sale.total,
              transaction_date: sale.timestamp.toISOString(),
              notes: `Credit sale - ${sale.items.length} items`,
              sync_status: 'synced'
            });

          if (creditError) {
            errors.push(`Failed to create credit transaction: ${creditError.message}`);
            continue;
          }
        }

        // Mark as synced in localStorage
        const updatedSales = sales.map(s => 
          s.id === sale.id ? { ...s, synced: true } : s
        );
        localStorage.setItem('sales', JSON.stringify(updatedSales));
        synced++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync sale: ${errorMsg}`);
      }
    }

    return { success: errors.length === 0, errors, synced };
  }

  // Sync credit transactions to Supabase
  private async syncCreditTransactions(): Promise<SyncResult> {
    console.log('SyncService: Syncing credit transactions...');
    const transactions: (CreditTransaction & { synced: boolean })[] = JSON.parse(localStorage.getItem('creditTransactions') || '[]').map((t: any) => ({
      ...t,
      date: new Date(t.date)
    }));

    const unsyncedTransactions = transactions.filter(t => !t.synced);
    if (unsyncedTransactions.length === 0) {
      return { success: true, errors: [], synced: 0 };
    }

    const errors: string[] = [];
    let synced = 0;

    for (const transaction of unsyncedTransactions) {
      try {
        const { error } = await supabase
          .from('credit_transactions')
          .insert({
            customer_id: transaction.customerId,
            transaction_type: transaction.type,
            amount: transaction.amount,
            notes: transaction.notes || null,
            transaction_date: transaction.date.toISOString(),
            sync_status: 'synced'
          });

        if (error) {
          errors.push(`Failed to sync credit transaction: ${error.message}`);
          continue;
        }

        // Mark as synced in localStorage
        const updatedTransactions = transactions.map(t => 
          t.id === transaction.id ? { ...t, synced: true } : t
        );
        localStorage.setItem('creditTransactions', JSON.stringify(updatedTransactions));
        synced++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync credit transaction: ${errorMsg}`);
      }
    }

    return { success: errors.length === 0, errors, synced };
  }

  // Force sync from Supabase to localStorage (for data recovery)
  async pullFromSupabase(): Promise<SyncResult> {
    console.log('SyncService: Pulling data from Supabase...');
    const errors: string[] = [];
    let synced = 0;

    try {
      // Pull products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        errors.push(`Failed to pull products: ${productsError.message}`);
      } else if (productsData) {
        const localProducts = productsData.map(p => ({
          id: p.id,
          name: p.name,
          quantity: p.quantity || 0,
          sellingPrice: Number(p.selling_price),
          costPrice: p.cost_price ? Number(p.cost_price) : undefined,
          unitType: p.unit_type || 'piece',
          category: p.category || undefined,
          sku: p.sku || undefined,
          expiryDate: p.expiry_date || undefined,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
          synced: true
        }));
        localStorage.setItem('products', JSON.stringify(localProducts));
        synced += localProducts.length;
      }

      // Pull customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) {
        errors.push(`Failed to pull customers: ${customersError.message}`);
      } else if (customersData) {
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
        localStorage.setItem('customers', JSON.stringify(localCustomers));
        synced += localCustomers.length;
      }

      // Pull credit transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*');

      if (transactionsError) {
        errors.push(`Failed to pull credit transactions: ${transactionsError.message}`);
      } else if (transactionsData) {
        const localTransactions = transactionsData.map(t => ({
          id: t.id,
          customerId: t.customer_id,
          type: t.transaction_type as 'sale' | 'payment',
          amount: Number(t.amount),
          notes: t.notes || undefined,
          date: new Date(t.transaction_date),
          synced: true
        }));
        localStorage.setItem('creditTransactions', JSON.stringify(localTransactions));
        synced += localTransactions.length;
      }

      // Update last sync
      localStorage.setItem('lastSync', new Date().toISOString());
      
      // Clear sync errors
      localStorage.removeItem('syncErrors');

      // Dispatch storage event to update UI
      window.dispatchEvent(new Event('storage'));

      return { success: errors.length === 0, errors, synced };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, errors: [errorMsg], synced };
    }
  }
}

export const syncService = new SyncService();
