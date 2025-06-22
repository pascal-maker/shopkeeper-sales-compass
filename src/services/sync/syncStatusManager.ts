
import { supabase } from "@/integrations/supabase/client";
import { SyncStatus } from "./types";
import { connectivityService } from "./connectivityService";
import { syncMetricsService } from "./syncMetricsService";
import { networkRetryService } from "./networkRetryService";

export class SyncStatusManager {
  private subscribers: Array<(status: SyncStatus) => void> = [];
  private statusCheckInterval: number | null = null;
  private readonly STATUS_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.startStatusMonitoring();
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySyncStatusChange(status: SyncStatus) {
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('SyncStatusManager: Error notifying subscriber:', error);
      }
    });
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      console.log('SyncStatusManager: Getting comprehensive sync status...');

      // Check connectivity with retry logic
      const connectivityResult = await networkRetryService.testConnectivity();
      const isOnline = connectivityResult.online;

      // Get last sync time
      const lastSyncStr = localStorage.getItem('lastSync');
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;

      // Count pending syncs from all data sources
      const pendingSyncs = this.countPendingSyncs();

      // Get sync errors with enhanced context
      const syncErrors = this.getSyncErrors();

      // Get performance metrics
      const metrics = syncMetricsService.getMetrics();

      const status: SyncStatus = {
        isOnline,
        lastSync,
        pendingSyncs,
        errors: syncErrors,
        connectivity: {
          online: isOnline,
          latency: connectivityResult.latency,
          error: connectivityResult.error
        },
        metrics: {
          successRate: metrics.totalOperations > 0 ? (metrics.successfulOperations / metrics.totalOperations) * 100 : 100,
          averageLatency: metrics.averageLatency,
          totalRetries: metrics.retryCount,
          lastSyncDuration: metrics.lastSyncDuration
        }
      };

      console.log('SyncStatusManager: Status compiled:', {
        online: isOnline,
        pending: pendingSyncs,
        errors: syncErrors.length,
        successRate: status.metrics?.successRate
      });

      return status;

    } catch (error) {
      console.error('SyncStatusManager: Error getting sync status:', error);
      return {
        isOnline: false,
        lastSync: null,
        pendingSyncs: 0,
        errors: ['Failed to get sync status'],
        connectivity: {
          online: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private countPendingSyncs(): number {
    try {
      let pending = 0;

      // Count unsynced sales
      const sales = JSON.parse(localStorage.getItem('sales') || '[]');
      pending += sales.filter((s: any) => !s.synced).length;

      // Count unsynced products
      const products = JSON.parse(localStorage.getItem('products') || '[]');
      pending += products.filter((p: any) => !p.synced).length;

      // Count unsynced customers
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      pending += customers.filter((c: any) => !c.synced).length;

      // Count unsynced credit transactions
      const creditTransactions = JSON.parse(localStorage.getItem('creditTransactions') || '[]');
      pending += creditTransactions.filter((ct: any) => !ct.synced).length;

      // Count inventory adjustments if any
      const inventoryAdjustments = JSON.parse(localStorage.getItem('inventoryAdjustments') || '[]');
      pending += inventoryAdjustments.filter((ia: any) => !ia.synced).length;

      console.log(`SyncStatusManager: Found ${pending} pending sync operations`);
      return pending;

    } catch (error) {
      console.error('SyncStatusManager: Error counting pending syncs:', error);
      return 0;
    }
  }

  private getSyncErrors(): string[] {
    try {
      const storedErrors = localStorage.getItem('syncErrors');
      const basicErrors = storedErrors ? JSON.parse(storedErrors) : [];

      // Add recent sync operation errors from metrics
      const recentErrors = syncMetricsService.getRecentErrors(5);
      const metricsErrors = recentErrors.map(err => `${err.operation}: ${err.error}`);

      // Combine and deduplicate errors
      const allErrors = [...basicErrors, ...metricsErrors];
      const uniqueErrors = [...new Set(allErrors)];

      // Limit to most recent errors
      return uniqueErrors.slice(-10);

    } catch (error) {
      console.error('SyncStatusManager: Error getting sync errors:', error);
      return ['Error retrieving sync status'];
    }
  }

  private startStatusMonitoring() {
    // Clear any existing interval
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }

    // Start periodic status checks
    this.statusCheckInterval = window.setInterval(async () => {
      try {
        const status = await this.getSyncStatus();
        this.notifySyncStatusChange(status);
      } catch (error) {
        console.error('SyncStatusManager: Periodic status check failed:', error);
      }
    }, this.STATUS_CHECK_INTERVAL);

    console.log('SyncStatusManager: Status monitoring started');
  }

  stopStatusMonitoring() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
      console.log('SyncStatusManager: Status monitoring stopped');
    }
  }

  // Enhanced method to trigger immediate status update
  async refreshStatus() {
    try {
      const status = await this.getSyncStatus();
      this.notifySyncStatusChange(status);
      return status;
    } catch (error) {
      console.error('SyncStatusManager: Status refresh failed:', error);
      throw error;
    }
  }

  // Method to clear old errors
  clearOldErrors() {
    try {
      localStorage.removeItem('syncErrors');
      syncMetricsService.clearMetrics();
      console.log('SyncStatusManager: Old errors cleared');
    } catch (error) {
      console.error('SyncStatusManager: Error clearing old errors:', error);
    }
  }
}
