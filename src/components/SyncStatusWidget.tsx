
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { syncService, SyncStatus } from "@/services/syncService";
import { SyncStatusDisplay } from "./sync/SyncStatusDisplay";
import { SyncActionButtons } from "./sync/SyncActionButtons";
import { useSyncOperations } from "@/hooks/useSyncOperations";

export const SyncStatusWidget = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    lastSync: null,
    pendingSyncs: 0,
    errors: []
  });

  const { isSyncing, handleSync, handlePullFromSupabase } = useSyncOperations();

  // Load initial sync status
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const status = await syncService.getSyncStatus();
        setSyncStatus(status);
        console.log('SyncStatusWidget: Initial sync status loaded:', status);
      } catch (error) {
        console.error('SyncStatusWidget: Failed to load initial sync status:', error);
      }
    };
    loadSyncStatus();

    // Subscribe to sync status changes
    const unsubscribe = syncService.onSyncStatusChange((status) => {
      console.log('SyncStatusWidget: Sync status changed:', status);
      setSyncStatus(status);
    });
    
    return unsubscribe;
  }, []);

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <SyncStatusDisplay syncStatus={syncStatus} />
          <SyncActionButtons 
            syncStatus={syncStatus}
            isSyncing={isSyncing}
            onSync={handleSync}
            onPullFromSupabase={handlePullFromSupabase}
          />
        </div>
      </CardContent>
    </Card>
  );
};
