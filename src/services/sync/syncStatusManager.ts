
import { SyncStatus } from "./types";

export class SyncStatusManager {
  private syncCallbacks: ((status: SyncStatus) => void)[] = [];

  // Subscribe to sync status changes
  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  notifySyncStatusChange(status: SyncStatus) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in sync status callback:', error);
      }
    });
  }

  // Get current sync status
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const { connectivityService } = await import("./connectivityService");
      const isOnline = await connectivityService.checkConnectivity();
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
}
