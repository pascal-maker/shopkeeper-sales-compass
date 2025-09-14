
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";

interface CustomerListHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddCustomer: () => void;
  isAddingCustomer: boolean;
}

export const CustomerListHeader = ({ 
  searchTerm, 
  onSearchChange, 
  onAddCustomer, 
  isAddingCustomer 
}: CustomerListHeaderProps) => {
  const { t } = useSettings();
  return (
    <div className="bg-card border-b border-border px-4 py-4 flex-shrink-0">
      <h1 className="text-2xl font-bold mb-4">{t('yourCustomers')}</h1>
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('searchByNameOrPhone')}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Add Customer Button */}
      <Button 
        onClick={onAddCustomer}
        className="w-full"
        size="lg"
        disabled={isAddingCustomer}
      >
        <Plus className="h-5 w-5 mr-2" />
        {isAddingCustomer ? t('loading') + "..." : t('addCustomer')}
      </Button>
    </div>
  );
};
