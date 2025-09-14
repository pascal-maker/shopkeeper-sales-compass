
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";

interface ProductsSearchBarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
}

export const ProductsSearchBar = ({
  searchTerm,
  setSearchTerm,
}: ProductsSearchBarProps) => {
  const { t } = useSettings();
  
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={t('searchProducts')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

