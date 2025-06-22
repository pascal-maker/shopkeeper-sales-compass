
export interface SyncResult {
  success: boolean;
  errors: string[];
  synced: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSyncs: number;
  errors: string[];
  connectivity?: {
    online: boolean;
    latency?: number;
    error?: string;
  };
  metrics?: {
    successRate: number;
    averageLatency: number;
    totalRetries: number;
    lastSyncDuration: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  fixes: string[];
}

export interface ConsistencyCheckResult {
  issues: string[];
  fixes: string[];
}

export interface DataIntegrityResult {
  valid: boolean;
  issues: string[];
  fixes: string[];
}

export interface InventoryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProductMappingResult {
  success: boolean;
  errors: string[];
  productMap: Map<string, string>;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingId?: string;
  conflicts: string[];
}

export interface ConnectivityResult {
  online: boolean;
  latency?: number;
  error?: string;
}

export interface TransactionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MetricsSnapshot {
  timestamp: Date;
  totalOperations: number;
  successRate: number;
  averageLatency: number;
  errorCount: number;
  retryCount: number;
}
