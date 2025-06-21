
import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { syncService, SyncStatus } from "@/services/syncService";

export const SyncStatusWidget = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    lastSync: null,
    pendingSyncs: 0,
    errors: []
  });
  const { toast } = useToast();

  // Load initial sync status
  useEffect(() => {
    const loadSyncStatus = async () => {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    };
    loadSyncStatus();

    // Subscribe to sync status changes
    const unsubscribe = syncService.onSyncStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.syncAll();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.synced} items.`,
        });
      } else {
        toast({
          title: "Sync Completed with Errors",
          description: `Synced ${result.synced} items. ${result.errors.length} errors occurred.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.pullFromSupabase();
      
      if (result.success) {
        toast({
          title: "Data Pulled Successfully",
          description: `Retrieved ${result.synced} items from server.`,
        });
      } else {
        toast({
          title: "Pull Completed with Errors",
          description: `Retrieved ${result.synced} items. ${result.errors.length} errors occurred.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Pull error:', error);
      toast({
        title: "Pull Failed",
        description: "Failed to pull data from server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return "Never";
    
    const now = new Date();
    const diffMs = now.getTime() - lastSync.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return "text-red-600";
    if (syncStatus.errors.length > 0) return "text-orange-600";
    if (syncStatus.pendingSyncs > 0) return "text-yellow-600";
    return "text-green-600";
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

  const getBadgeVariant = () => {
    if (!syncStatus.isOnline) return "destructive";
    if (syncStatus.errors.length > 0) return "secondary";
    if (syncStatus.pendingSyncs > 0) return "outline";
    return "default";
  };

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{getStatusText()}</span>
                <Badge variant={getBadgeVariant()}>
                  {syncStatus.pendingSyncs > 0 ? `${syncStatus.pendingSyncs} pending` : getStatusText()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last sync: {formatLastSync(syncStatus.lastSync)}
              </div>
              {syncStatus.errors.length > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  {syncStatus.errors.length} sync error{syncStatus.errors.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePullFromSupabase}
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
              onClick={handleSync}
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
        </div>
      </CardContent>
    </Card>
  );
};
