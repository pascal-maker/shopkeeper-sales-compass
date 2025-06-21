
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
    this.syncCallbacks.forEach(callback => callback(status));
  }

  // Check if we're online and can sync
  async checkConnectivity(): Promise<boolean> {
    return connectivityService.checkConnectivity();
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
      const productsResult = await productSync.syncProducts();
      if (!productsResult.success) {
        errors.push(...productsResult.errors);
      } else {
        totalSynced += productsResult.synced;
      }

      const customersResult = await customerSync.syncCustomers();
      if (!customersResult.success) {
        errors.push(...customersResult.errors);
      } else {
        totalSynced += customersResult.synced;
      }

      const salesResult = await salesSync.syncSales();
      if (!salesResult.success) {
        errors.push(...salesResult.errors);
      } else {
        totalSynced += salesResult.synced;
      }

      const transactionsResult = await creditTransactionSync.syncCreditTransactions();
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

  // Force sync from Supabase to localStorage (for data recovery)
  async pullFromSupabase(): Promise<SyncResult> {
    console.log('SyncService: Pulling data from Supabase...');
    const errors: string[] = [];
    let synced = 0;

    try {
      // Pull products
      const productsResult = await productSync.pullProducts();
      if (productsResult.errors.length > 0) {
        errors.push(...productsResult.errors);
      } else {
        localStorage.setItem('products', JSON.stringify(productsResult.products));
        synced += productsResult.products.length;
      }

      // Pull customers
      const customersResult = await customerSync.pullCustomers();
      if (customersResult.errors.length > 0) {
        errors.push(...customersResult.errors);
      } else {
        localStorage.setItem('customers', JSON.stringify(customersResult.customers));
        synced += customersResult.customers.length;
      }

      // Pull credit transactions
      const transactionsResult = await creditTransactionSync.pullCreditTransactions();
      if (transactionsResult.errors.length > 0) {
        errors.push(...transactionsResult.errors);
      } else {
        localStorage.setItem('creditTransactions', JSON.stringify(transactionsResult.transactions));
        synced += transactionsResult.transactions.length;
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
export type { SyncStatus, SyncResult };
