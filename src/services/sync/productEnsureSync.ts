
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/services/inventoryService";

// Helper function to ensure products exist in Supabase before sales sync
export const productEnsureSync = {
  async ensureProductsExist(products: Product[]): Promise<{ success: boolean; errors: string[]; productMap: Map<string, string> }> {
    console.log('ProductEnsureSync: Ensuring products exist before sales sync...');
    const errors: string[] = [];
    const productMap = new Map<string, string>(); // Maps local ID to Supabase UUID

    for (const product of products) {
      try {
        // First check if product already exists by name
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id, name, quantity, selling_price')
          .eq('name', product.name)
          .maybeSingle();

        if (existingProduct) {
          // Product exists, map local ID to Supabase UUID
          productMap.set(product.id, existingProduct.id);
          console.log(`ProductEnsureSync: Product "${product.name}" already exists with ID ${existingProduct.id}`);
        } else {
          // Product doesn't exist, create it
          console.log(`ProductEnsureSync: Creating new product "${product.name}"`);
          
          const { data: newProduct, error } = await supabase
            .from('products')
            .insert({
              name: product.name,
              selling_price: product.sellingPrice,
              cost_price: product.costPrice || null,
              quantity: Math.max(0, product.quantity), // Ensure non-negative quantity
              unit_type: product.unitType || 'piece',
              category: product.category || null,
              sku: product.sku || null,
              expiry_date: product.expiryDate || null,
              sync_status: 'synced'
            })
            .select('id')
            .single();

          if (error) {
            errors.push(`Failed to create product ${product.name}: ${error.message}`);
            console.error(`ProductEnsureSync: Error creating product ${product.name}:`, error);
            continue;
          }

          if (newProduct) {
            productMap.set(product.id, newProduct.id);
            console.log(`ProductEnsureSync: Created product "${product.name}" with ID ${newProduct.id}`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to ensure product ${product.name}: ${errorMsg}`);
        console.error(`ProductEnsureSync: Unexpected error for product ${product.name}:`, error);
      }
    }

    return { success: errors.length === 0, errors, productMap };
  },

  async validateInventoryConstraints(saleItems: any[], productMap: Map<string, string>): Promise<{ valid: boolean; errors: string[] }> {
    console.log('ProductEnsureSync: Validating inventory constraints...');
    const errors: string[] = [];

    for (const item of saleItems) {
      try {
        // The item.product_id is already the Supabase product ID
        const supabaseProductId = item.product_id;
        if (!supabaseProductId) {
          errors.push(`Product ID not found for item: ${item.product_id}`);
          continue;
        }

        // Check current quantity in Supabase
        const { data: productData, error } = await supabase
          .from('products')
          .select('quantity, name')
          .eq('id', supabaseProductId)
          .single();

        if (error) {
          errors.push(`Failed to check inventory for product ${supabaseProductId}: ${error.message}`);
          continue;
        }

        if (productData.quantity < item.quantity) {
          errors.push(`Insufficient inventory for ${productData.name}. Available: ${productData.quantity}, Required: ${item.quantity}`);
        } else if (productData.quantity - item.quantity < 0) {
          errors.push(`Sale would result in negative inventory for ${productData.name}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Inventory validation error: ${errorMsg}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
};
