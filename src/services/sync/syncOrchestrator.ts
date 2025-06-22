
import { SyncResult } from "./types";
import { connectivityService } from "./connectivityService";
import { productSync } from "./productSync";
import { customerSync } from "./customerSync";
import { salesSync } from "./salesSync";
import { creditTransactionSync } from "./creditTransactionSync";
import { dataConsistencyService } from "./dataConsistencyService";

export class SyncOrchestrator {
  // Enhanced sync with data consistency checks
  async syncAll(): Promise<SyncResult> {
    const errors: string[] = [];
    let totalSynced = 0;

    try {
      console.log('SyncOrchestrator: Starting enhanced full sync with consistency checks...');
      
      // Check connectivity first
      const isOnline = await connectivityService.checkConnectivity();
      if (!isOnline) {
        return { success: false, errors: ['No internet connection'], synced: 0 };
      }

      // Step 1: Validate and fix local data consistency
      console.log('SyncOrchestrator: Validating local data consistency...');
      const localValidation = await dataConsistencyService.validateLocalStorageData();
      if (localValidation.errors.length > 0) {
        console.warn('SyncOrchestrator: Local data issues found:', localValidation.errors);
        errors.push(...localValidation.errors.map(err => `Local data: ${err}`));
      }
      if (localValidation.fixes.length > 0) {
        console.log('SyncOrchestrator: Applied local data fixes:', localValidation.fixes);
      }

      // Step 2: Sync in proper dependency order
      totalSynced += await this.syncProducts(errors);
      totalSynced += await this.syncCustomers(errors);
      totalSynced += await this.syncSales(errors);
      totalSynced += await this.syncCreditTransactions(errors);

      // Step 3: Run database consistency checks
      await this.runConsistencyChecks(errors);

      // Update last sync time and store errors
      this.updateSyncMetadata(errors);

      const uniqueErrors = [...new Set(errors)];
      return { success: uniqueErrors.length === 0, errors: uniqueErrors, synced: totalSynced };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('SyncOrchestrator: Sync failed:', errorMsg);
      errors.push(errorMsg);
      
      // Store errors even if sync failed
      localStorage.setItem('syncErrors', JSON.stringify([...new Set(errors)]));
      
      return { success: false, errors: [...new Set(errors)], synced: totalSynced };
    }
  }

  private async syncProducts(errors: string[]): Promise<number> {
    try {
      console.log('SyncOrchestrator: Syncing products...');
      const productsResult = await productSync.syncProducts();
      if (!productsResult.success) {
        errors.push(...productsResult.errors.map(err => `Products: ${err}`));
      } else {
        console.log(`SyncOrchestrator: Synced ${productsResult.synced} products`);
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
      console.log('SyncOrchestrator: Syncing customers...');
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

  private async runConsistencyChecks(errors: string[]) {
    console.log('SyncOrchestrator: Running database consistency checks...');
    try {
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
      errors.push(`Consistency check failed: ${errorMsg}`);
      console.error('SyncOrchestrator: Consistency check error:', error);
    }
  }

  private updateSyncMetadata(errors: string[]) {
    localStorage.setItem('lastSync', new Date().toISOString());
    const uniqueErrors = [...new Set(errors)];
    localStorage.setItem('syncErrors', JSON.stringify(uniqueErrors));
  }
}
