
import { Package, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const InventorySnapshot = () => {
  const lowStockItems = [
    { name: "Milk 1L", stock: 3, minStock: 10 },
    { name: "Bread", stock: 2, minStock: 5 },
    { name: "Eggs (dozen)", stock: 1, minStock: 8 }
  ];

  const totalProducts = 156;
  const lowStockCount = lowStockItems.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Inventory
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{totalProducts}</div>
            <div className="text-sm text-muted-foreground">Total Products</div>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{lowStockCount}</div>
            <div className="text-sm text-muted-foreground">Low Stock</div>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Needs Restocking</span>
            </div>
            {lowStockItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-destructive/5 rounded border-l-2 border-destructive">
                <span className="text-sm font-medium">{item.name}</span>
                <Badge variant="destructive" className="text-xs">
                  {item.stock} left
                </Badge>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-10">
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
          <Button variant="outline" size="sm" className="h-10">
            <Package className="h-4 w-4 mr-1" />
            Add Stock
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
