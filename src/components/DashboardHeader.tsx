
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";

export const DashboardHeader = () => {
  const { profile } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-card border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Stock & Sales</h1>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
            {profile?.business_name && (
              <p className="text-xs text-muted-foreground">{profile.business_name}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full"></span>
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
