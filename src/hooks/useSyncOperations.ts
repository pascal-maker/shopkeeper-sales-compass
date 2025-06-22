
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { syncService } from "@/services/syncService";

export const useSyncOperations = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      console.log('SyncOperations: Starting sync...');
      const result = await syncService.syncAll();
      console.log('SyncOperations: Sync completed:', result);
      
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
        
        console.error('SyncOperations: Sync errors:', result.errors);
      }
    } catch (error) {
      console.error('SyncOperations: Sync error:', error);
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
      console.log('SyncOperations: Starting pull from Supabase...');
      const result = await syncService.pullFromSupabase();
      console.log('SyncOperations: Pull completed:', result);
      
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
        
        console.error('SyncOperations: Pull errors:', result.errors);
      }
    } catch (error) {
      console.error('SyncOperations: Pull error:', error);
      toast({
        title: "Pull Failed",
        description: "Failed to pull data from server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    handleSync,
    handlePullFromSupabase,
  };
};
