
import { useToast } from "@/hooks/use-toast";

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

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export const updateInventoryAfterSale = (cartItems: CartItem[]): { success: boolean; errors: string[] } => {
  try {
    // Get current products from localStorage
    const storedProducts = localStorage.getItem('products');
    if (!storedProducts) {
      return { success: false, errors: ['No products found in inventory'] };
    }

    const products: Product[] = JSON.parse(storedProducts).map((product: any) => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    }));

    const errors: string[] = [];
    const updatedProducts = [...products];

    // Update quantities for each cart item
    cartItems.forEach(cartItem => {
      const productIndex = updatedProducts.findIndex(product => product.id === cartItem.id.toString());
      
      if (productIndex === -1) {
        errors.push(`Product ${cartItem.name} not found in inventory`);
        return;
      }

      const product = updatedProducts[productIndex];
      
      // Check if there's enough stock
      if (product.quantity < cartItem.quantity) {
        errors.push(`Insufficient stock for ${cartItem.name}. Available: ${product.quantity}, Required: ${cartItem.quantity}`);
        return;
      }

      // Update the product quantity
      updatedProducts[productIndex] = {
        ...product,
        quantity: product.quantity - cartItem.quantity,
        updatedAt: new Date()
      };

      console.log(`Updated inventory for ${cartItem.name}: ${product.quantity} -> ${product.quantity - cartItem.quantity}`);
    });

    // If there are errors, don't save the changes
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Save updated products back to localStorage
    localStorage.setItem('products', JSON.stringify(updatedProducts));
    
    // Dispatch event to notify other components of inventory changes
    window.dispatchEvent(new Event('storage'));

    console.log('Inventory updated successfully after sale');
    return { success: true, errors: [] };

  } catch (error) {
    console.error('Error updating inventory:', error);
    return { success: false, errors: ['Failed to update inventory: ' + (error as Error).message] };
  }
};

export const checkStockAvailability = (cartItems: CartItem[]): { available: boolean; errors: string[] } => {
  try {
    const storedProducts = localStorage.getItem('products');
    if (!storedProducts) {
      return { available: false, errors: ['No products found in inventory'] };
    }

    const products: Product[] = JSON.parse(storedProducts);
    const errors: string[] = [];

    cartItems.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.id.toString());
      
      if (!product) {
        errors.push(`Product ${cartItem.name} not found in inventory`);
        return;
      }

      if (product.quantity < cartItem.quantity) {
        errors.push(`Insufficient stock for ${cartItem.name}. Available: ${product.quantity}, Required: ${cartItem.quantity}`);
      }
    });

    return { available: errors.length === 0, errors };

  } catch (error) {
    console.error('Error checking stock availability:', error);
    return { available: false, errors: ['Failed to check stock availability'] };
  }
};
