
import { syncMetricsService } from "./syncMetricsService";

export class SyncMetadataManager {
  private static instance: SyncMetadataManager;
  
  static getInstance(): SyncMetadataManager {
    if (!SyncMetadataManager.instance) {
      SyncMetadataManager.instance = new SyncMetadataManager();
    }
    return SyncMetadataManager.instance;
  }

  updateSyncMetadata(errors: string[], duration: number): void {
    localStorage.setItem('lastSync', new Date().toISOString());
    localStorage.setItem('lastSyncDuration', duration.toString());
    const uniqueErrors = [...new Set(errors)];
    localStorage.setItem('syncErrors', JSON.stringify(uniqueErrors));
    
    // Store sync metrics
    const metrics = syncMetricsService.getMetrics();
    localStorage.setItem('syncMetrics', JSON.stringify(metrics));
  }

  recordSyncOperation(operationName: string, duration: number, success: boolean, error?: string): void {
    syncMetricsService.recordOperation(operationName, duration, success, error);
  }

  storeSyncErrors(errors: string[]): void {
    localStorage.setItem('syncErrors', JSON.stringify([...new Set(errors)]));
  }
}

export const syncMetadataManager = SyncMetadataManager.getInstance();
