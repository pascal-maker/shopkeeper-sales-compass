
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "../ProductsManager";

interface EditProductFormProps {
  product: Product;
  onSubmit: (updates: Partial<Product>) => void;
  onCancel: () => void;
}

export const EditProductForm = ({ product, onSubmit, onCancel }: EditProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product.name,
    quantity: product.quantity.toString(),
    sellingPrice: product.sellingPrice.toString(),
    costPrice: product.costPrice?.toString() || '',
    unitType: product.unitType || '',
    category: product.category || '',
    sku: product.sku || '',
    expiryDate: product.expiryDate || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(
    !!(product.costPrice || product.unitType || product.category || product.sku || product.expiryDate)
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (!formData.sellingPrice || isNaN(Number(formData.sellingPrice)) || Number(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Valid selling price is required';
    }

    if (formData.costPrice && (isNaN(Number(formData.costPrice)) || Number(formData.costPrice) < 0)) {
      newErrors.costPrice = 'Cost price must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const updates: Partial<Product> = {
      name: formData.name.trim(),
      quantity: Number(formData.quantity),
      sellingPrice: Number(formData.sellingPrice),
      costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
      unitType: formData.unitType || undefined,
      category: formData.category || undefined,
      sku: formData.sku || undefined,
      expiryDate: formData.expiryDate || undefined
    };

    onSubmit(updates);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Required Fields */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Product Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Coca Cola 500ml"
                className={`mt-1 ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={`mt-1 ${errors.quantity ? 'border-destructive' : ''}`}
                />
                {errors.quantity && <p className="text-sm text-destructive mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <Label htmlFor="sellingPrice" className="text-sm font-medium">
                  Selling Price *
                </Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className={`mt-1 ${errors.sellingPrice ? 'border-destructive' : ''}`}
                />
                {errors.sellingPrice && <p className="text-sm text-destructive mt-1">{errors.sellingPrice}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Fields Toggle */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>

        {/* Advanced Fields */}
        {showAdvanced && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="costPrice" className="text-sm font-medium">
                  Cost Price (Optional)
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => handleInputChange('costPrice', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className={`mt-1 ${errors.costPrice ? 'border-destructive' : ''}`}
                />
                {errors.costPrice && <p className="text-sm text-destructive mt-1">{errors.costPrice}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitType" className="text-sm font-medium">
                    Unit Type
                  </Label>
                  <Input
                    id="unitType"
                    value={formData.unitType}
                    onChange={(e) => handleInputChange('unitType', e.target.value)}
                    placeholder="e.g. Piece, Pack, Kg"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    placeholder="e.g. Drinks, Snacks"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sku" className="text-sm font-medium">
                  SKU/Barcode
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Product code or barcode"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="expiryDate" className="text-sm font-medium">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            Update Product
          </Button>
        </div>
      </form>
    </div>
  );
};
