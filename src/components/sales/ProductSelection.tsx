
import { useState, useEffect } from "react";
import { Search, Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CartItem } from "../SalesEntry";

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  quantity: number;
  unitType?: string;
  category?: string;
}

interface ProductSelectionProps {
  cart: CartItem[];
  onAddToCart: (product: { id: number; name: string; price: number }) => void;
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
  const [products, setProducts] = useState<Product[]>([]);

  // Load products from localStorage on component mount
  useEffect(() => {
    const loadProducts = () => {
      try {
        const storedProducts = localStorage.getItem('products');
        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);
          setProducts(parsedProducts);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();

    // Listen for storage events to update products when they change
    const handleStorageChange = () => {
      loadProducts();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCartQuantity = (productId: string) => {
    const cartItem = cart.find(item => item.id === parseInt(productId));
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart({
      id: parseInt(product.id),
      name: product.name,
      price: product.sellingPrice
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    onUpdateQuantity(parseInt(productId), newQuantity);
  };

  if (products.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Select Products</h1>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No products available</h3>
            <p className="text-muted-foreground mb-4">
              Add products to your inventory first before recording sales
            </p>
            <Button onClick={() => window.dispatchEvent(new CustomEvent('switchToProducts'))}>
              Go to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                      <span className="text-primary font-bold text-xl">${product.sellingPrice}</span>
                      <span className="text-sm text-muted-foreground">
                        Stock: {product.quantity} {product.unitType || 'pcs'}
                      </span>
                    </div>
                    {product.category && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {product.category}
                      </Badge>
                    )}
                  </div>

                  {cartQuantity > 0 ? (
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(product.id, cartQuantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-semibold text-lg px-4">{cartQuantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(product.id, cartQuantity + 1)}
                        disabled={cartQuantity >= product.quantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full h-10"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.quantity === 0}
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
