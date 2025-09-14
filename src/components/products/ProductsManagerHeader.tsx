
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AddProductForm } from "./AddProductForm";
import { BatchProductEntry } from "./BatchProductEntry";
import { useSettings } from "@/contexts/SettingsContext";

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
}: ProductsManagerHeaderProps) => {
  const { t } = useSettings();
  
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold">{t('products')}</h1>
    <div className="flex gap-2">
      <Sheet open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <SheetTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t('add')}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('addNewProduct')}</SheetTitle>
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
            {t('batch')}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-none">
          <SheetHeader>
            <SheetTitle>{t('addMultipleProducts')}</SheetTitle>
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
};

