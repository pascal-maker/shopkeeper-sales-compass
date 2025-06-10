
import { MoreVertical, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Product } from "../ProductsManager";

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  const isLowStock = product.quantity <= 10;
  const hasExpiry = product.expiryDate;
  const isExpiringSoon = hasExpiry && new Date(product.expiryDate!) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

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
                      Expiring
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Selling Price</div>
                <div className="font-medium">{formatCurrency(product.sellingPrice)}</div>
              </div>
              {product.costPrice && (
                <div>
                  <div className="text-muted-foreground text-xs">Cost Price</div>
                  <div className="font-medium">{formatCurrency(product.costPrice)}</div>
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
                    Expires: {formatDate(product.expiryDate)}
                  </div>
                )}
              </div>
            )}

            {isLowStock && (
              <div className="mt-2 flex items-center gap-1 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs font-medium">Low Stock Alert</span>
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
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
