
import { SyncStatus, SyncResult } from "./sync/types";
import { connectivityService } from "./sync/connectivityService";
import { productSync } from "./sync/productSync";
import { customerSync } from "./sync/customerSync";
import { salesSync } from "./sync/salesSync";
import { creditTransactionSync } from "./sync/creditTransactionSync";

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
    this.syncCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status callback:', error);
      }
    });
  }

  // Check if we're online and can sync
  async checkConnectivity(): Promise<boolean> {
    try {
      return await connectivityService.checkConnectivity();
    } catch (error) {
      console.error('Connectivity check failed:', error);
      return false;
    }
  }

  // Get current sync status
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const isOnline = await this.checkConnectivity();
      const lastSyncStr = localStorage.getItem('lastSync');
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;
      
      // Count pending items safely
      let pendingSyncs = 0;
      try {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        const creditTransactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
        
        const pendingProducts = products.filter((p: any) => !p.synced).length;
        const pendingCustomers = customers.filter((c: any) => !c.synced).length;
        const pendingSales = sales.filter((s: any) => !s.synced).length;
        const pendingTransactions = creditTransactions.filter((t: any) => !t.synced).length;
        pendingSyncs = pendingProducts + pendingCustomers + pendingSales + pendingTransactions;
      } catch (error) {
        console.error('Error counting pending syncs:', error);
      }

      const errors = JSON.parse(localStorage.getItem('syncErrors') || '[]');

      return {
        isOnline,
        lastSync,
        pendingSyncs,
        errors
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: false,
        lastSync: null,
        pendingSyncs: 0,
        errors: ['Failed to get sync status']
      };
    }
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
      try {
        const productsResult = await productSync.syncProducts();
        if (!productsResult.success) {
          errors.push(...productsResult.errors);
        } else {
          totalSynced += productsResult.synced;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Product sync failed: ${errorMsg}`);
      }

      try {
        const customersResult = await customerSync.syncCustomers();
        if (!customersResult.success) {
          errors.push(...customersResult.errors);
        } else {
          totalSynced += customersResult.synced;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Customer sync failed: ${errorMsg}`);
      }

      try {
        const salesResult = await salesSync.syncSales();
        if (!salesResult.success) {
          errors.push(...salesResult.errors);
        } else {
          totalSynced += salesResult.synced;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Sales sync failed: ${errorMsg}`);
      }

      try {
        const transactionsResult = await creditTransactionSync.syncCreditTransactions();
        if (!transactionsResult.success) {
          errors.push(...transactionsResult.errors);
        } else {
          totalSynced += transactionsResult.synced;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Credit transactions sync failed: ${errorMsg}`);
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
      errors.push(errorMsg);
      
      // Store errors even if sync failed
      localStorage.setItem('syncErrors', JSON.stringify(errors));
      
      return { success: false, errors, synced: totalSynced };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Force sync from Supabase to localStorage (for data recovery)
  async pullFromSupabase(): Promise<SyncResult> {
    console.log('SyncService: Pulling data from Supabase...');
    const errors: string[] = [];
    let synced = 0;

    try {
      // Check connectivity first
      const isOnline = await this.checkConnectivity();
      if (!isOnline) {
        return { success: false, errors: ['No internet connection'], synced: 0 };
      }

      // Pull products
      try {
        const productsResult = await productSync.pullProducts();
        if (productsResult.errors.length > 0) {
          errors.push(...productsResult.errors);
        } else {
          localStorage.setItem('products', JSON.stringify(productsResult.products));
          synced += productsResult.products.length;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to pull products: ${errorMsg}`);
      }

      // Pull customers
      try {
        const customersResult = await customerSync.pullCustomers();
        if (customersResult.errors.length > 0) {
          errors.push(...customersResult.errors);
        } else {
          localStorage.setItem('customers', JSON.stringify(customersResult.customers));
          synced += customersResult.customers.length;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to pull customers: ${errorMsg}`);
      }

      // Pull credit transactions
      try {
        const transactionsResult = await creditTransactionSync.pullCreditTransactions();
        if (transactionsResult.errors.length > 0) {
          errors.push(...transactionsResult.errors);
        } else {
          localStorage.setItem('creditTransactions', JSON.stringify(transactionsResult.transactions));
          synced += transactionsResult.transactions.length;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to pull credit transactions: ${errorMsg}`);
      }

      // Update last sync
      localStorage.setItem('lastSync', new Date().toISOString());
      
      // Clear sync errors if pull was successful
      if (errors.length === 0) {
        localStorage.removeItem('syncErrors');
      } else {
        localStorage.setItem('syncErrors', JSON.stringify(errors));
      }

      // Dispatch storage event to update UI
      window.dispatchEvent(new Event('storage'));

      // Notify status change
      const status = await this.getSyncStatus();
      this.notifySyncStatusChange(status);

      return { success: errors.length === 0, errors, synced };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMsg);
      localStorage.setItem('syncErrors', JSON.stringify(errors));
      return { success: false, errors, synced };
    }
  }
}

export const syncService = new SyncService();
export type { SyncStatus, SyncResult };
