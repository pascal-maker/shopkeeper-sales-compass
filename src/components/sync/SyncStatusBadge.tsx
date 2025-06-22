
import { Badge } from "@/components/ui/badge";
import { SyncStatus } from "@/services/syncService";

interface SyncStatusBadgeProps {
  syncStatus: SyncStatus;
}

export const SyncStatusBadge = ({ syncStatus }: SyncStatusBadgeProps) => {
  const getBadgeVariant = () => {
    if (!syncStatus.isOnline) return "destructive";
    if (syncStatus.errors.length > 0) return "secondary";
    if (syncStatus.pendingSyncs > 0) return "outline";
    return "default";
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return "Offline";
    if (syncStatus.errors.length > 0) return "Errors";
    if (syncStatus.pendingSyncs > 0) return "Pending";
    return "Synced";
  };

  const getBadgeText = () => {
    if (syncStatus.pendingSyncs > 0) {
      return `${syncStatus.pendingSyncs} pending`;
    }
    return getStatusText();
  };

  return (
    <Badge variant={getBadgeVariant()}>
      {getBadgeText()}
    </Badge>
  );
};
