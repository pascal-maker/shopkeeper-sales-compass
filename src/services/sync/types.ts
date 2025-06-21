
export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingSyncs: number;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  errors: string[];
  synced: number;
}
