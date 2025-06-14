
import { supabase } from "@/integrations/supabase/client";

export interface LocalProduct {
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

export const productSyncService = {
  async syncProductToSupabase(localProduct: LocalProduct): Promise<{ success: boolean; supabaseId?: string; error?: string }> {
    try {
      console.log('ProductSyncService: Syncing product to Supabase:', localProduct.name);
      
      // Check if product already exists in Supabase by name
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('name', localProduct.name)
        .maybeSingle();

      if (checkError) {
        console.error('ProductSyncService: Error checking existing product:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingProduct) {
        console.log('ProductSyncService: Product already exists in Supabase:', existingProduct.id);
        return { success: true, supabaseId: existingProduct.id };
      }

      // Create new product in Supabase
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          name: localProduct.name,
          selling_price: localProduct.sellingPrice,
          cost_price: localProduct.costPrice || null,
          quantity: localProduct.quantity,
          unit_type: localProduct.unitType || 'piece',
          category: localProduct.category || null,
          sku: localProduct.sku || null,
          expiry_date: localProduct.expiryDate || null,
          sync_status: 'synced'
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('ProductSyncService: Error creating product in Supabase:', insertError);
        return { success: false, error: insertError.message };
      }

      console.log('ProductSyncService: Product created in Supabase:', newProduct.id);
      return { success: true, supabaseId: newProduct.id };
    } catch (error) {
      console.error('ProductSyncService: Unexpected error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unexpected error' };
    }
  },

  async ensureProductsExistInSupabase(localProducts: LocalProduct[]): Promise<{ success: boolean; errors: string[] }> {
    console.log('ProductSyncService: Ensuring products exist in Supabase for', localProducts.length, 'products');
    
    const errors: string[] = [];
    
    for (const product of localProducts) {
      const result = await this.syncProductToSupabase(product);
      if (!result.success) {
        errors.push(`Failed to sync ${product.name}: ${result.error}`);
      }
    }

    return { success: errors.length === 0, errors };
  }
};
