import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const QuickSalesEntry = () => {
  const topProducts = [
    { id: 1, name: "Coca Cola 500ml", price: 25, stock: 48 },
    { id: 2, name: "Bread", price: 15, stock: 12 },
    { id: 3, name: "Milk 1L", price: 45, stock: 8 },
    { id: 4, name: "Rice 1kg", price: 85, stock: 25 },
    { id: 5, name: "Sugar 1kg", price: 65, stock: 15 }
  ];

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Sale
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Button 
          className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90" 
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Start New Sale
        </Button>
        
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Add Products</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {topProducts.map((product) => (
              <Button
                key={product.id}
                variant="outline"
                className="h-auto p-3 flex flex-col items-start hover:bg-muted/50"
              >
                <span className="font-medium text-sm">{product.name}</span>
                <div className="flex justify-between w-full mt-1">
                  <span className="text-primary font-semibold">${product.price}</span>
                  <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
