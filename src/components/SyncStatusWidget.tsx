
import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const SyncStatusWidget = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("2 minutes ago");

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
    setLastSync("Just now");
  };

  return (
    <Card className="bg-muted/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Cloud className="h-5 w-5 text-green-600" />
            ) : (
              <CloudOff className="h-5 w-5 text-red-600" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {isOnline ? "Online" : "Offline Mode"}
                </span>
                <Badge 
                  variant={isOnline ? "default" : "secondary"} 
                  className={isOnline ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                >
                  {isOnline ? "Synced" : "Local Only"}
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
            disabled={isSyncing || !isOnline}
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
