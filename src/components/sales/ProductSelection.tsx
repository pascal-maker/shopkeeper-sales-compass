
import { useState } from "react";
import { Search, Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "../SalesEntry";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface ProductSelectionProps {
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  totalAmount: number;
  onProceedToPayment: () => void;
}

export const ProductSelection = ({
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  totalAmount,
  onProceedToPayment
}: ProductSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const products: Product[] = [
    { id: 1, name: "Coca Cola 500ml", price: 25, stock: 48 },
    { id: 2, name: "Bread", price: 15, stock: 12 },
    { id: 3, name: "Milk 1L", price: 45, stock: 8 },
    { id: 4, name: "Rice 1kg", price: 85, stock: 25 },
    { id: 5, name: "Sugar 1kg", price: 65, stock: 15 },
    { id: 6, name: "Cooking Oil 500ml", price: 120, stock: 20 },
    { id: 7, name: "Eggs (dozen)", price: 180, stock: 6 },
    { id: 8, name: "Soap Bar", price: 35, stock: 30 }
  ];

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCartQuantity = (productId: number) => {
    const cartItem = cart.find(item => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Select Products</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          ${totalAmount}
        </Badge>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredProducts.map((product) => {
          const cartQuantity = getCartQuantity(product.id);
          return (
            <Card key={product.id} className="relative">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-primary font-bold text-xl">${product.price}</span>
                      <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                    </div>
                  </div>

                  {cartQuantity > 0 ? (
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(product.id, cartQuantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold text-lg px-4">{cartQuantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                        disabled={cartQuantity >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-10"
                      onClick={() => onAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cart ({cart.length} items)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} × ${item.price} = ${item.quantity * item.price}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFromCart(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-lg">Total: ${totalAmount}</span>
              <Button onClick={onProceedToPayment} size="lg" className="min-w-[120px]">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
