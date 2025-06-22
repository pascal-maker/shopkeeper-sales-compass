
import { Cloud, CloudOff, AlertCircle } from "lucide-react";
import { SyncStatus } from "@/services/syncService";
import { SyncStatusBadge } from "./SyncStatusBadge";

interface SyncStatusDisplayProps {
  syncStatus: SyncStatus;
}

export const SyncStatusDisplay = ({ syncStatus }: SyncStatusDisplayProps) => {
  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return "Never";
    
    try {
      const now = new Date();
      const diffMs = now.getTime() - lastSync.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (error) {
      console.error('SyncStatusDisplay: Error formatting last sync time:', error);
      return "Unknown";
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return <CloudOff className="h-5 w-5 text-red-600" />;
    if (syncStatus.errors.length > 0) return <AlertCircle className="h-5 w-5 text-orange-600" />;
    if (syncStatus.pendingSyncs > 0) return <Cloud className="h-5 w-5 text-yellow-600" />;
    return <Cloud className="h-5 w-5 text-green-600" />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return "Offline";
    if (syncStatus.errors.length > 0) return "Errors";
    if (syncStatus.pendingSyncs > 0) return "Pending";
    return "Synced";
  };

  return (
    <div className="flex items-center gap-3">
      {getStatusIcon()}
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{getStatusText()}</span>
          <SyncStatusBadge syncStatus={syncStatus} />
        </div>
        <div className="text-xs text-muted-foreground">
          Last sync: {formatLastSync(syncStatus.lastSync)}
        </div>
        {syncStatus.errors.length > 0 && (
          <div className="text-xs text-orange-600 mt-1" title={syncStatus.errors.join('; ')}>
            {syncStatus.errors.length} sync error{syncStatus.errors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
