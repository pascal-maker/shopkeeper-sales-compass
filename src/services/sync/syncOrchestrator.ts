
import { SyncResult } from "./types";
import { connectivityService } from "./connectivityService";
import { networkRetryService } from "./networkRetryService";
import { syncValidationService } from "./syncValidationService";
import { syncStepExecutor } from "./syncStepExecutor";
import { syncMetadataManager } from "./syncMetadataManager";

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

      // Step 1: Validate database state before sync
      await syncValidationService.validateDatabaseStateBeforeSync(errors);

      // Step 2: Local data cleanup and deduplication
      await syncValidationService.performLocalDataCleanup(errors);

      // Step 3: Validate local data consistency
      await syncValidationService.validateLocalDataConsistency(errors);

      // Step 4: Sync in proper dependency order with transaction wrapping
      totalSynced += await syncStepExecutor.syncWithTransactionWrapper('products', () => syncStepExecutor.syncProducts(errors));
      totalSynced += await syncStepExecutor.syncWithTransactionWrapper('customers', () => syncStepExecutor.syncCustomers(errors));
      totalSynced += await syncStepExecutor.syncWithTransactionWrapper('sales', () => syncStepExecutor.syncSales(errors));
      totalSynced += await syncStepExecutor.syncWithTransactionWrapper('credit-transactions', () => syncStepExecutor.syncCreditTransactions(errors));

      // Step 5: Post-sync validation and cleanup
      await syncValidationService.performPostSyncValidation(errors);

      // Update metrics and metadata
      const syncDuration = Date.now() - syncStartTime;
      syncMetadataManager.updateSyncMetadata(errors, syncDuration);

      const uniqueErrors = [...new Set(errors)];
      syncMetadataManager.recordSyncOperation('full-sync', syncDuration, uniqueErrors.length === 0, uniqueErrors.join('; '));

      console.log(`SyncOrchestrator: Enhanced sync completed in ${syncDuration}ms. Synced: ${totalSynced}, Errors: ${uniqueErrors.length}`);
      return { success: uniqueErrors.length === 0, errors: uniqueErrors, synced: totalSynced };

    } catch (error) {
      const syncDuration = Date.now() - syncStartTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('SyncOrchestrator: Sync failed:', errorMsg);
      errors.push(errorMsg);
      
      // Store errors and record metrics
      syncMetadataManager.storeSyncErrors([...new Set(errors)]);
      syncMetadataManager.recordSyncOperation('full-sync', syncDuration, false, errorMsg);
      
      return { success: false, errors: [...new Set(errors)], synced: totalSynced };
    }
  }
}
