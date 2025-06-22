
import { RefreshCw, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncStatus } from "@/services/syncService";

interface SyncActionButtonsProps {
  syncStatus: SyncStatus;
  isSyncing: boolean;
  onSync: () => void;
  onPullFromSupabase: () => void;
}

export const SyncActionButtons = ({ 
  syncStatus, 
  isSyncing, 
  onSync, 
  onPullFromSupabase 
}: SyncActionButtonsProps) => {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onPullFromSupabase}
        disabled={isSyncing || !syncStatus.isOnline}
        className="h-8"
        title="Pull latest data from server"
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onSync}
        disabled={isSyncing}
        className="h-8"
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-1" />
        )}
        {isSyncing ? "Syncing..." : "Sync Now"}
      </Button>
    </div>
  );
};
