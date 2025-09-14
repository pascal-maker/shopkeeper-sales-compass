
import { Home, Package, ShoppingCart, Users, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";

interface NavigationTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const NavigationTabs = ({ currentTab, onTabChange }: NavigationTabsProps) => {
  const { t } = useSettings();
  
  const tabs = [
    { id: "dashboard", label: t('dashboard'), icon: Home },
    { id: "products", label: t('products'), icon: Package },
    { id: "sales", label: t('sales'), icon: ShoppingCart },
    { id: "customers", label: t('customers'), icon: Users },
    { id: "reports", label: t('reports'), icon: BarChart3 },
    { id: "settings", label: t('settings'), icon: Settings }
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
