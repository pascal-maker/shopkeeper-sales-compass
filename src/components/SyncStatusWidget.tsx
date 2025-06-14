
import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export const SyncStatusWidget = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("Just now");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Invalidate all queries to refetch data
      await queryClient.invalidateQueries();
      setLastSync("Just now");
      toast({
        title: "Sync Complete",
        description: "All data has been synchronized successfully.",
      });
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

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="h-5 w-5 text-green-600" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Online</span>
                <Badge 
                  variant="default" 
                  className="bg-green-100 text-green-800"
                >
                  Synced
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last sync: {lastSync}
              </div>
            </div>
          </div>
          
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
      </CardContent>
    </Card>
  );
};
