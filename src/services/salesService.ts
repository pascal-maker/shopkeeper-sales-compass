
import { supabase } from "@/integrations/supabase/client";
import { Sale, CartItem } from "@/types/sales";
import { Customer } from "@/types/customer";
import { Product } from "./inventoryService";
import { productEnsureSync } from "./sync/productEnsureSync";

// Helper function to check if a string is a valid UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const salesService = {
  async saveSale(sale: Sale): Promise<{ saleId: string; success: boolean; error?: string }> {
    try {
      console.log('SalesService: Saving sale with enhanced validation:', sale);
      
      // Convert payment type to match database enum
      const paymentTypeMap = {
        'mobile-money': 'mobile_money' as const,
        'cash': 'cash' as const,
        'credit': 'credit' as const
      };
      
      // Get localStorage products to ensure they exist in Supabase
      const storedProducts = localStorage.getItem('products');
      if (!storedProducts) {
        return { saleId: '', success: false, error: 'No products found in local inventory' };
      }

      const localProducts: Product[] = JSON.parse(storedProducts).map((product: any) => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt)
      }));

      // Find products that are in our sale items
      const saleProductIds = sale.items.map(item => item.id);
      const relevantProducts = localProducts.filter(product => saleProductIds.includes(product.id));
      
      if (relevantProducts.length === 0) {
        return { saleId: '', success: false, error: 'No matching products found in inventory' };
      }

      // Ensure products exist in Supabase with enhanced validation
      console.log('SalesService: Ensuring products exist with enhanced validation...');
      const productEnsureResult = await productEnsureSync.ensureProductsExist(relevantProducts);
      
      if (!productEnsureResult.success) {
        console.error('SalesService: Failed to ensure products exist:', productEnsureResult.errors);
        return { saleId: '', success: false, error: `Product sync failed: ${productEnsureResult.errors.join(', ')}` };
      }

      // Map sale items to use Supabase product IDs
      const mappedSaleItems = sale.items.map(item => {
        const supabaseProductId = productEnsureResult.productMap.get(item.id);
        if (!supabaseProductId) {
          throw new Error(`Product mapping not found for item: ${item.name} (${item.id})`);
        }
        
        return {
          product_id: supabaseProductId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.quantity * item.price
        };
      });

      // Validate inventory constraints
      const inventoryValidation = await productEnsureSync.validateInventoryConstraints(
        mappedSaleItems, 
        productEnsureResult.productMap
      );

      if (!inventoryValidation.valid) {
        console.error('SalesService: Inventory validation failed:', inventoryValidation.errors);
        return { saleId: '', success: false, error: `Inventory validation failed: ${inventoryValidation.errors.join(', ')}` };
      }

      // Get current user ID for RLS
      const { data: { user } } = await supabase.auth.getUser();

      // Save the sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: sale.total,
          payment_type: paymentTypeMap[sale.paymentType],
          customer_id: sale.customer?.id || null,
          sale_date: sale.timestamp.toISOString(),
          user_id: user?.id,
          sync_status: 'synced' as const
        })
        .select()
        .single();

      if (saleError) {
        console.error('SalesService: Error saving sale:', saleError);
        return { saleId: '', success: false, error: saleError.message };
      }

      console.log('SalesService: Sale saved successfully:', saleData);

      // Save sale items with mapped product IDs
      const saleItemsWithSaleId = mappedSaleItems.map(item => ({
        ...item,
        sale_id: saleData.id,
        sync_status: 'synced' as const
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsWithSaleId);

      if (itemsError) {
        console.error('SalesService: Error saving sale items:', itemsError);
        return { saleId: saleData.id, success: false, error: itemsError.message };
      }

      console.log('SalesService: Sale items saved successfully');

      // If it's a credit sale, create a credit transaction
      if (sale.paymentType === 'credit' && sale.customer) {
        console.log('SalesService: Creating credit transaction for customer:', sale.customer.id);
        
        // Get current user ID for RLS
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error: creditError } = await supabase
          .from('credit_transactions')
          .insert({
            customer_id: sale.customer.id,
            sale_id: saleData.id,
            transaction_type: 'sale' as const,
            amount: sale.total,
            transaction_date: sale.timestamp.toISOString(),
            notes: `Credit sale - ${sale.items.length} items`,
            user_id: user?.id,
            sync_status: 'synced' as const
          });

        if (creditError) {
          console.error('SalesService: Error creating credit transaction:', creditError);
          return { saleId: saleData.id, success: false, error: creditError.message };
        }

        console.log('SalesService: Credit transaction created successfully');
      }

      return { saleId: saleData.id, success: true };
    } catch (error) {
      console.error('SalesService: Unexpected error:', error);
      return { saleId: '', success: false, error: error instanceof Error ? error.message : 'Unexpected error occurred' };
    }
  }
};
