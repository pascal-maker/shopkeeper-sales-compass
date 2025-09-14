
import { MoreVertical, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Product } from "../ProductsManager";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  const { currency, t } = useSettings();
  const isLowStock = product.quantity <= 10;
  const hasExpiry = product.expiryDate;
  const isExpiringSoon = hasExpiry && new Date(product.expiryDate!) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className={`${isLowStock ? 'border-orange-200 bg-orange-50/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-medium text-sm leading-tight mb-1">{product.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant={isLowStock ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {product.quantity} {product.unitType || 'pcs'}
                  </Badge>
                  {product.category && (
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  )}
                  {isExpiringSoon && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {t('expiring')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">{t('sellingPrice')}</div>
                <div className="font-medium">{formatCurrency(product.sellingPrice, currency)}</div>
              </div>
              {product.costPrice && (
                <div>
                  <div className="text-muted-foreground text-xs">{t('costPrice')}</div>
                  <div className="font-medium">{formatCurrency(product.costPrice, currency)}</div>
                </div>
              )}
            </div>

            {(product.sku || product.expiryDate) && (
              <div className="mt-2 space-y-1">
                {product.sku && (
                  <div className="text-xs text-muted-foreground">
                    SKU: {product.sku}
                  </div>
                )}
                {product.expiryDate && (
                  <div className="text-xs text-muted-foreground">
                    {t('expires')}: {formatDate(product.expiryDate)}
                  </div>
                )}
              </div>
            )}

            {isLowStock && (
              <div className="mt-2 flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs font-medium">{t('lowStockAlert')}</span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border shadow-lg">
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
