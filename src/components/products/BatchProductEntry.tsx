
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Product } from "../ProductsManager";

interface BatchProductEntryProps {
  onSubmit: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onCancel: () => void;
}

interface BatchProductRow {
  id: string;
  name: string;
  quantity: string;
  sellingPrice: string;
  errors: Record<string, string>;
}

export const BatchProductEntry = ({ onSubmit, onCancel }: BatchProductEntryProps) => {
  const [rows, setRows] = useState<BatchProductRow[]>([
    { id: '1', name: '', quantity: '', sellingPrice: '', errors: {} },
    { id: '2', name: '', quantity: '', sellingPrice: '', errors: {} },
    { id: '3', name: '', quantity: '', sellingPrice: '', errors: {} }
  ]);

  const addRow = () => {
    const newRow: BatchProductRow = {
      id: Date.now().toString(),
      name: '',
      quantity: '',
      sellingPrice: '',
      errors: {}
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (rowId: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== rowId));
    }
  };

  const updateRow = (rowId: string, field: keyof BatchProductRow, value: string) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: value };
        
        // Clear error for this field
        if (updatedRow.errors[field]) {
          updatedRow.errors = { ...updatedRow.errors, [field]: '' };
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  const validateRows = () => {
    const updatedRows = rows.map(row => {
      const errors: Record<string, string> = {};

      // Only validate rows that have at least one field filled
      const hasData = row.name || row.quantity || row.sellingPrice;
      
      if (hasData) {
        if (!row.name.trim()) {
          errors.name = 'Name required';
        }

        if (!row.quantity || isNaN(Number(row.quantity)) || Number(row.quantity) < 0) {
          errors.quantity = 'Valid quantity required';
        }

        if (!row.sellingPrice || isNaN(Number(row.sellingPrice)) || Number(row.sellingPrice) <= 0) {
          errors.sellingPrice = 'Valid price required';
        }
      }

      return { ...row, errors };
    });

    setRows(updatedRows);

    // Check if there are any errors in rows with data
    const hasErrors = updatedRows.some(row => {
      const hasData = row.name || row.quantity || row.sellingPrice;
      return hasData && Object.keys(row.errors).length > 0;
    });

    // Check if there's at least one valid product
    const validProducts = updatedRows.filter(row => {
      const hasData = row.name && row.quantity && row.sellingPrice;
      return hasData && Object.keys(row.errors).length === 0;
    });

    return { hasErrors, validProducts: validProducts.length > 0 };
  };

  const handleSubmit = () => {
    const { hasErrors, validProducts } = validateRows();

    if (hasErrors || !validProducts) {
      return;
    }

    const productsToAdd: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = rows
      .filter(row => row.name && row.quantity && row.sellingPrice)
      .filter(row => Object.keys(row.errors).length === 0)
      .map(row => ({
        name: row.name.trim(),
        quantity: Number(row.quantity),
        sellingPrice: Number(row.sellingPrice)
      }));

    if (productsToAdd.length > 0) {
      onSubmit(productsToAdd);
    }
  };

  const filledRowsCount = rows.filter(row => 
    row.name || row.quantity || row.sellingPrice
  ).length;

  return (
    <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Multiple Products</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fill in the required fields for each product. Empty rows will be ignored.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Headers */}
          <div className="grid grid-cols-12 gap-2 items-center text-sm font-medium text-muted-foreground">
            <div className="col-span-5">Product Name *</div>
            <div className="col-span-3">Quantity *</div>
            <div className="col-span-3">Price *</div>
            <div className="col-span-1"></div>
          </div>

          {/* Product Rows */}
          {rows.map((row, index) => (
            <div key={row.id} className="space-y-2">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5">
                  <Input
                    value={row.name}
                    onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                    placeholder={`Product ${index + 1}`}
                    className={row.errors.name ? 'border-destructive' : ''}
                  />
                  {row.errors.name && (
                    <p className="text-xs text-destructive mt-1">{row.errors.name}</p>
                  )}
                </div>

                <div className="col-span-3">
                  <Input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                    placeholder="0"
                    min="0"
                    className={row.errors.quantity ? 'border-destructive' : ''}
                  />
                  {row.errors.quantity && (
                    <p className="text-xs text-destructive mt-1">{row.errors.quantity}</p>
                  )}
                </div>

                <div className="col-span-3">
                  <Input
                    type="number"
                    step="0.01"
                    value={row.sellingPrice}
                    onChange={(e) => updateRow(row.id, 'sellingPrice', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    className={row.errors.sellingPrice ? 'border-destructive' : ''}
                  />
                  {row.errors.sellingPrice && (
                    <p className="text-xs text-destructive mt-1">{row.errors.sellingPrice}</p>
                  )}
                </div>

                <div className="col-span-1">
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(row.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Row Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRow}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add More Rows
          </Button>

          {/* Summary */}
          {filledRowsCount > 0 && (
            <div className="text-sm text-muted-foreground text-center py-2 bg-muted/30 rounded">
              {filledRowsCount} product{filledRowsCount !== 1 ? 's' : ''} ready to add
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={filledRowsCount === 0}
        >
          Save All Products
        </Button>
      </div>
    </div>
  );
};
