import { useState, useEffect } from "react";
import { Plus, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AddProductForm } from "./products/AddProductForm";
import { BatchProductEntry } from "./products/BatchProductEntry";
import { ProductList } from "./products/ProductList";
import { useToast } from "@/hooks/use-toast";
import { ProductsManagerHeader } from "./products/ProductsManagerHeader";
import { ProductsSearchBar } from "./products/ProductsSearchBar";
import { ProductStatsCards } from "./products/ProductStatsCards";

export interface Product {
  id: string;
  name: string;
  quantity: number;
  sellingPrice: number;
  costPrice?: number;
  unitType?: string;
  category?: string;
  sku?: string;
  expiryDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductsManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load products from localStorage on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    try {
      const storedProducts = localStorage.getItem('products');
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts).map((product: any) => ({
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt)
        }));
        setProducts(parsedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products from storage",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProducts = (updatedProducts: Product[]) => {
    try {
      localStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error saving products:', error);
      toast({
        title: "Error",
        description: "Failed to save products",
        variant: "destructive"
      });
    }
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedProducts = [...products, newProduct];
    saveProducts(updatedProducts);

    toast({
      title: "Success",
      description: `${productData.name} added to inventory`
    });

    return newProduct;
  };

  const addMultipleProducts = (productsData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const newProducts: Product[] = productsData.map(productData => ({
      ...productData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const updatedProducts = [...products, ...newProducts];
    saveProducts(updatedProducts);

    toast({
      title: "Success",
      description: `${newProducts.length} products added to inventory`
    });

    return newProducts;
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    const updatedProducts = products.map(product =>
      product.id === productId
        ? { ...product, ...updates, updatedAt: new Date() }
        : product
    );
    saveProducts(updatedProducts);

    toast({
      title: "Success",
      description: "Product updated successfully"
    });
  };

  const deleteProduct = (productId: string) => {
    const updatedProducts = products.filter(product => product.id !== productId);
    saveProducts(updatedProducts);

    toast({
      title: "Success",
      description: "Product removed from inventory"
    });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <ProductsManagerHeader
          isAddFormOpen={isAddFormOpen}
          setIsAddFormOpen={setIsAddFormOpen}
          isBatchFormOpen={isBatchFormOpen}
          setIsBatchFormOpen={setIsBatchFormOpen}
          addProduct={addProduct}
          addMultipleProducts={addMultipleProducts}
        />
        {/* Search */}
        <ProductsSearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>
      {/* Stats */}
      <div className="p-4">
        <ProductStatsCards
          totalProducts={products.length}
          lowStockCount={products.filter(p => p.quantity <= 10).length}
        />
        {/* Product List */}
        <ProductList
          products={filteredProducts}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
        />
      </div>
    </div>
  );
};
