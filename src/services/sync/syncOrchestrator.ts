
import { SyncResult } from "./types";
import { connectivityService } from "./connectivityService";
import { productSync } from "./productSync";
import { customerSync } from "./customerSync";
import { salesSync } from "./salesSync";
import { creditTransactionSync } from "./creditTransactionSync";
import { dataConsistencyService } from "./dataConsistencyService";
import { transactionWrapper } from "./transactionWrapper";
import { networkRetryService } from "./networkRetryService";
import { duplicatePreventionService } from "./duplicatePreventionService";
import { syncMetricsService } from "./syncMetricsService";

export class SyncOrchestrator {
  // Enhanced sync with transaction wrapping and retry logic
  async syncAll(): Promise<SyncResult> {
    const syncStartTime = Date.now();
    const errors: string[] = [];
    let totalSynced = 0;

    try {
      console.log('SyncOrchestrator: Starting enhanced full sync with transaction wrapping...');
      
      // Check connectivity with retry logic
      const connectivityResult = await networkRetryService.executeWithRetry(
        () => connectivityService.checkConnectivity(),
        { maxRetries: 2, timeoutMs: 10000 }
      );

      if (!connectivityResult) {
        return { success: false, errors: ['No internet connection'], synced: 0 };
      }

      // Validate database state before sync
      console.log('SyncOrchestrator: Validating database state...');
      const dbValidation = await transactionWrapper.validateDatabaseState();
      if (!dbValidation.valid) {
        console.warn('SyncOrchestrator: Database issues detected:', dbValidation.issues);
        errors.push(...dbValidation.issues.map(issue => `DB validation: ${issue}`));
      }

      // Step 1: Local data cleanup and deduplication
      console.log('SyncOrchestrator: Cleaning up local duplicates...');
      const dedupeResult = await duplicatePreventionService.deduplicateLocalStorage();
      if (dedupeResult.fixed > 0) {
        console.log(`SyncOrchestrator: Fixed ${dedupeResult.fixed} duplicate entries`);
      }
      if (dedupeResult.errors.length > 0) {
        errors.push(...dedupeResult.errors);
      }

      // Step 2: Validate local data consistency
      console.log('SyncOrchestrator: Validating local data consistency...');
      const localValidation = await dataConsistencyService.validateLocalStorageData();
      if (localValidation.errors.length > 0) {
        console.warn('SyncOrchestrator: Local data issues found:', localValidation.errors);
        errors.push(...localValidation.errors.map(err => `Local data: ${err}`));
      }
      if (localValidation.fixes.length > 0) {
        console.log('SyncOrchestrator: Applied local data fixes:', localValidation.fixes);
      }

      // Step 3: Sync in proper dependency order with transaction wrapping
      totalSynced += await this.syncWithTransactionWrapper('products', () => this.syncProducts(errors));
      totalSynced += await this.syncWithTransactionWrapper('customers', () => this.syncCustomers(errors));
      totalSynced += await this.syncWithTransactionWrapper('sales', () => this.syncSales(errors));
      totalSynced += await this.syncWithTransactionWrapper('credit-transactions', () => this.syncCreditTransactions(errors));

      // Step 4: Post-sync validation and cleanup
      await this.postSyncValidation(errors);

      // Update metrics and metadata
      const syncDuration = Date.now() - syncStartTime;
      this.updateSyncMetadata(errors, syncDuration);

      const uniqueErrors = [...new Set(errors)];
      syncMetricsService.recordOperation('full-sync', syncDuration, uniqueErrors.length === 0, uniqueErrors.join('; '));

      console.log(`SyncOrchestrator: Enhanced sync completed in ${syncDuration}ms. Synced: ${totalSynced}, Errors: ${uniqueErrors.length}`);
      return { success: uniqueErrors.length === 0, errors: uniqueErrors, synced: totalSynced };

    } catch (error) {
      const syncDuration = Date.now() - syncStartTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('SyncOrchestrator: Sync failed:', errorMsg);
      errors.push(errorMsg);
      
      // Store errors and record metrics
      localStorage.setItem('syncErrors', JSON.stringify([...new Set(errors)]));
      syncMetricsService.recordOperation('full-sync', syncDuration, false, errorMsg);
      
      return { success: false, errors: [...new Set(errors)], synced: totalSynced };
    }
  }

  private async syncWithTransactionWrapper(
    operationName: string, 
    syncOperation: () => Promise<number>
  ): Promise<number> {
    const startTime = Date.now();
    
    try {
      const result = await transactionWrapper.executeInTransaction(
        syncOperation,
        { maxRetries: 2, retryDelay: 2000, timeoutMs: 60000 }
      );

      const duration = Date.now() - startTime;
      
      if (result.success && typeof result.data === 'number') {
        syncMetricsService.recordOperation(operationName, duration, true);
        return result.data;
      } else {
        syncMetricsService.recordOperation(operationName, duration, false, result.error);
        console.error(`SyncOrchestrator: ${operationName} sync failed:`, result.error);
        return 0;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      syncMetricsService.recordOperation(operationName, duration, false, errorMsg);
      console.error(`SyncOrchestrator: ${operationName} sync error:`, error);
      return 0;
    }
  }

  private async syncProducts(errors: string[]): Promise<number> {
    try {
      console.log('SyncOrchestrator: Syncing products with enhanced validation...');
      const productsResult = await productSync.syncProducts();
      if (!productsResult.success) {
        errors.push(...productsResult.errors.map(err => `Products: ${err}`));
      } else {
        console.log(`SyncOrchestrator: Synced ${produc

tsResult.synced} products`);
        return productsResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Product sync failed: ${errorMsg}`);
      console.error('SyncOrchestrator: Product sync error:', error);
    }
    return 0;
  }

  private async syncCustomers(errors: string[]): Promise<number> {
    try {
      console.log('SyncOrchestrator: Syncing customers with duplicate prevention...');
      const customersResult = await customerSync.syncCustomers();
      if (!customersResult.success) {
        errors.push(...customersResult.errors.map(err => `Customers: ${err}`));
      } else {
        console.log(`SyncOrchestrator: Synced ${customersResult.synced} customers`);
        return customersResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Customer sync failed: ${errorMsg}`);
      console.error('SyncOrchestrator: Customer sync error:', error);
    }
    return 0;
  }

  private async syncSales(errors: string[]): Promise<number> {
    try {
      console.log('SyncOrchestrator: Syncing sales with enhanced validation...');
      const salesResult = await salesSync.syncSales();
      if (!salesResult.success) {
        errors.push(...salesResult.errors.map(err => `Sales: ${err}`));
      } else {
        console.log(`SyncOrchestrator: Synced ${salesResult.synced} sales`);
        return salesResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Sales sync failed: ${errorMsg}`);
      console.error('SyncOrchestrator: Sales sync error:', error);
    }
    return 0;
  }

  private async syncCreditTransactions(errors: string[]): Promise<number> {
    try {
      console.log('SyncOrchestrator: Syncing credit transactions...');
      const transactionsResult = await creditTransactionSync.syncCreditTransactions();
      if (!transactionsResult.success) {
        errors.push(...transactionsResult.errors.map(err => `Credit: ${err}`));
      } else {
        console.log(`SyncOrchestrator: Synced ${transactionsResult.synced} credit transactions`);
        return transactionsResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Credit transactions sync failed: ${errorMsg}`);
      console.error('SyncOrchestrator: Credit transaction sync error:', error);
    }
    return 0;
  }

  private async postSyncValidation(errors: string[]) {
    console.log('SyncOrchestrator: Running post-sync validation...');
    try {
      // Validate database consistency after sync
      const postSyncValidation = await transactionWrapper.validateDatabaseState();
      if (!postSyncValidation.valid) {
        console.warn('SyncOrchestrator: Post-sync database issues:', postSyncValidation.issues);
        errors.push(...postSyncValidation.issues.map(issue => `Post-sync: ${issue}`));
      }

      // Run comprehensive data consistency check
      const consistencyResult = await dataConsistencyService.checkAndFixConsistency();
      if (consistencyResult.issues.length > 0) {
        console.warn('SyncOrchestrator: Database consistency issues found:', consistencyResult.issues);
        errors.push(...consistencyResult.issues.map(issue => `DB consistency: ${issue}`));
      }
      if (consistencyResult.fixes.length > 0) {
        console.log('SyncOrchestrator: Applied database consistency fixes:', consistencyResult.fixes);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Post-sync validation failed: ${errorMsg}`);
      console.error('SyncOrchestrator: Post-sync validation error:', error);
    }
  }

  private updateSyncMetadata(errors: string[], duration: number) {
    localStorage.setItem('lastSync', new Date().toISOString());
    localStorage.setItem('lastSyncDuration', duration.toString());
    const uniqueErrors = [...new Set(errors)];
    localStorage.setItem('syncErrors', JSON.stringify(uniqueErrors));
    
    // Store sync metrics
    const metrics = syncMetricsService.getMetrics();
    localStorage.setItem('syncMetrics', JSON.stringify(metrics));
  }
}
