
import { Home, Package, ShoppingCart, Users, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const NavigationTabs = ({ currentTab, onTabChange }: NavigationTabsProps) => {
  const tabs = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "products", label: "Products", icon: Package },
    { id: "sales", label: "Sales", icon: ShoppingCart },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2">
      <div className="grid grid-cols-6 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`h-12 flex-col gap-1 px-1 ${
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};
