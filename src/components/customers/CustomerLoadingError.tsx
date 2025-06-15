
import { Button } from "@/components/ui/button";

interface CustomerLoadingErrorProps {
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

export const CustomerLoadingError = ({ isLoading, error, onRetry }: CustomerLoadingErrorProps) => {
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading customers</p>
          <Button onClick={onRetry}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
