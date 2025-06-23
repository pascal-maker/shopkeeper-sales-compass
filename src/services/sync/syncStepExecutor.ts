
import { productSync } from "./productSync";
import { customerSync } from "./customerSync";
import { salesSync } from "./salesSync";
import { creditTransactionSync } from "./creditTransactionSync";
import { transactionWrapper } from "./transactionWrapper";
import { syncMetricsService } from "./syncMetricsService";

export class SyncStepExecutor {
  private static instance: SyncStepExecutor;
  
  static getInstance(): SyncStepExecutor {
    if (!SyncStepExecutor.instance) {
      SyncStepExecutor.instance = new SyncStepExecutor();
    }
    return SyncStepExecutor.instance;
  }

  async syncWithTransactionWrapper(
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
        console.error(`SyncStepExecutor: ${operationName} sync failed:`, result.error);
        return 0;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      syncMetricsService.recordOperation(operationName, duration, false, errorMsg);
      console.error(`SyncStepExecutor: ${operationName} sync error:`, error);
      return 0;
    }
  }

  async syncProducts(errors: string[]): Promise<number> {
    try {
      console.log('SyncStepExecutor: Syncing products with enhanced validation...');
      const productsResult = await productSync.syncProducts();
      if (!productsResult.success) {
        errors.push(...productsResult.errors.map(err => `Products: ${err}`));
      } else {
        console.log(`SyncStepExecutor: Synced ${productsResult.synced} products`);
        return productsResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Product sync failed: ${errorMsg}`);
      console.error('SyncStepExecutor: Product sync error:', error);
    }
    return 0;
  }

  async syncCustomers(errors: string[]): Promise<number> {
    try {
      console.log('SyncStepExecutor: Syncing customers with duplicate prevention...');
      const customersResult = await customerSync.syncCustomers();
      if (!customersResult.success) {
        errors.push(...customersResult.errors.map(err => `Customers: ${err}`));
      } else {
        console.log(`SyncStepExecutor: Synced ${customersResult.synced} customers`);
        return customersResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Customer sync failed: ${errorMsg}`);
      console.error('SyncStepExecutor: Customer sync error:', error);
    }
    return 0;
  }

  async syncSales(errors: string[]): Promise<number> {
    try {
      console.log('SyncStepExecutor: Syncing sales with enhanced validation...');
      const salesResult = await salesSync.syncSales();
      if (!salesResult.success) {
        errors.push(...salesResult.errors.map(err => `Sales: ${err}`));
      } else {
        console.log(`SyncStepExecutor: Synced ${salesResult.synced} sales`);
        return salesResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Sales sync failed: ${errorMsg}`);
      console.error('SyncStepExecutor: Sales sync error:', error);
    }
    return 0;
  }

  async syncCreditTransactions(errors: string[]): Promise<number> {
    try {
      console.log('SyncStepExecutor: Syncing credit transactions...');
      const transactionsResult = await creditTransactionSync.syncCreditTransactions();
      if (!transactionsResult.success) {
        errors.push(...transactionsResult.errors.map(err => `Credit: ${err}`));
      } else {
        console.log(`SyncStepExecutor: Synced ${transactionsResult.synced} credit transactions`);
        return transactionsResult.synced;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Credit transactions sync failed: ${errorMsg}`);
      console.error('SyncStepExecutor: Credit transaction sync error:', error);
    }
    return 0;
  }
}

export const syncStepExecutor = SyncStepExecutor.getInstance();
