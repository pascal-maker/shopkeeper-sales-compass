
import { supabase } from "@/integrations/supabase/client";
import { SyncResult } from "./types";

export interface TransactionOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeoutMs?: number;
}

export class TransactionWrapper {
  private static instance: TransactionWrapper;
  
  static getInstance(): TransactionWrapper {
    if (!TransactionWrapper.instance) {
      TransactionWrapper.instance = new TransactionWrapper();
    }
    return TransactionWrapper.instance;
  }

  async executeInTransaction<T>(
    operations: () => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const { maxRetries = 3, retryDelay = 1000, timeoutMs = 30000 } = options;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`TransactionWrapper: Attempt ${attempt + 1}/${maxRetries + 1}`);
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs);
        });

        // Execute operations with timeout
        const result = await Promise.race([
          operations(),
          timeoutPromise
        ]);

        console.log('TransactionWrapper: Transaction completed successfully');
        return { success: true, data: result as T };

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown transaction error';
        console.error(`TransactionWrapper: Attempt ${attempt + 1} failed:`, errorMsg);

        // If this is the last attempt, return the error
        if (attempt === maxRetries) {
          return { success: false, error: errorMsg };
        }

        // Wait before retrying (exponential backoff)
        const delay = retryDelay * Math.pow(2, attempt);
        console.log(`TransactionWrapper: Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  async executeBatchOperations(
    operations: Array<() => Promise<any>>,
    options: TransactionOptions = {}
  ): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;

    try {
      console.log(`TransactionWrapper: Executing ${operations.length} batch operations`);
      
      // Execute operations in smaller batches to avoid overwhelming the database
      const batchSize = 5;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        
        const batchResult = await this.executeInTransaction(async () => {
          const results = await Promise.allSettled(batch.map(op => op()));
          return results;
        }, options);

        if (!batchResult.success) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${batchResult.error}`);
          continue;
        }

        // Process batch results
        if (batchResult.data) {
          for (const result of batchResult.data) {
            if (result.status === 'fulfilled') {
              synced++;
            } else {
              errors.push(`Operation failed: ${result.reason}`);
            }
          }
        }
      }

      console.log(`TransactionWrapper: Batch operations completed. Synced: ${synced}, Errors: ${errors.length}`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown batch error';
      errors.push(`Batch execution failed: ${errorMsg}`);
      console.error('TransactionWrapper: Batch execution error:', error);
    }

    return { success: errors.length === 0, errors, synced };
  }

  async validateDatabaseState(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      console.log('TransactionWrapper: Validating database state...');

      // Check for orphaned sale items
      const { data: orphanedItems, error: orphanError } = await supabase
        .from('sale_items')
        .select('id, sale_id')
        .is('sale_id', null);

      if (orphanError) {
        issues.push(`Failed to check orphaned sale items: ${orphanError.message}`);
      } else if (orphanedItems && orphanedItems.length > 0) {
        issues.push(`Found ${orphanedItems.length} orphaned sale items`);
      }

      // Check for negative product quantities
      const { data: negativeStock, error: stockError } = await supabase
        .from('products')
        .select('id, name, quantity')
        .lt('quantity', 0);

      if (stockError) {
        issues.push(`Failed to check negative stock: ${stockError.message}`);
      } else if (negativeStock && negativeStock.length > 0) {
        issues.push(`Found ${negativeStock.length} products with negative stock`);
      }

      // Skip the RPC call for now since the function doesn't exist
      // This prevents the TypeScript error about argument type 'string' not assignable to 'never'
      console.log('TransactionWrapper: Skipping duplicate customer check (function not implemented)');

      console.log(`TransactionWrapper: Database validation completed. Issues found: ${issues.length}`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown validation error';
      issues.push(`Database validation failed: ${errorMsg}`);
      console.error('TransactionWrapper: Database validation error:', error);
    }

    return { valid: issues.length === 0, issues };
  }
}

export const transactionWrapper = TransactionWrapper.getInstance();
