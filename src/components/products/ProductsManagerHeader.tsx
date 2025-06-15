
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AddProductForm } from "./AddProductForm";
import { BatchProductEntry } from "./BatchProductEntry";

interface ProductsManagerHeaderProps {
  isAddFormOpen: boolean;
  setIsAddFormOpen: (open: boolean) => void;
  isBatchFormOpen: boolean;
  setIsBatchFormOpen: (open: boolean) => void;
  addProduct: (data: any) => void;
  addMultipleProducts: (data: any[]) => void;
}

export const ProductsManagerHeader = ({
  isAddFormOpen,
  setIsAddFormOpen,
  isBatchFormOpen,
  setIsBatchFormOpen,
  addProduct,
  addMultipleProducts,
}: ProductsManagerHeaderProps) => (
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-2xl font-bold">Products</h1>
    <div className="flex gap-2">
      <Sheet open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <SheetTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add New Product</SheetTitle>
          </SheetHeader>
          <AddProductForm
            onSubmit={(productData) => {
              addProduct(productData);
              setIsAddFormOpen(false);
            }}
            onCancel={() => setIsAddFormOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <Sheet open={isBatchFormOpen} onOpenChange={setIsBatchFormOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Batch
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-none">
          <SheetHeader>
            <SheetTitle>Add Multiple Products</SheetTitle>
          </SheetHeader>
          <BatchProductEntry
            onSubmit={(productsData) => {
              addMultipleProducts(productsData);
              setIsBatchFormOpen(false);
            }}
            onCancel={() => setIsBatchFormOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  </div>
);

