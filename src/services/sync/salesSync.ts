
import { supabase } from "@/integrations/supabase/client";
import { Sale } from "@/types/sales";
import { SyncResult } from "./types";

// Helper function to check if a string is a valid UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const salesSync = {
  async syncSales(): Promise<SyncResult> {
    console.log('SalesSync: Syncing sales...');
    const sales: (Sale & { id: number; synced: boolean })[] = JSON.parse(localStorage.getItem('sales') || '[]').map((s: any) => ({
      ...s,
      timestamp: new Date(s.timestamp)
    }));

    const unsyncedSales = sales.filter(s => !s.synced);
    if (unsyncedSales.length === 0) {
      return { success: true, errors: [], synced: 0 };
    }

    const errors: string[] = [];
    let synced = 0;

    for (const sale of unsyncedSales) {
      try {
        // Map payment type
        const paymentTypeMap = {
          'mobile-money': 'mobile_money' as const,
          'cash': 'cash' as const,
          'credit': 'credit' as const
        };

        // Create sale
        const { data: saleData, error: saleError } = await supabase
          .from('sales')
          .insert({
            total_amount: sale.total,
            payment_type: paymentTypeMap[sale.paymentType],
            customer_id: sale.customer?.id || null,
            sale_date: sale.timestamp.toISOString(),
            sync_status: 'synced'
          })
          .select()
          .single();

        if (saleError) {
          errors.push(`Failed to sync sale: ${saleError.message}`);
          continue;
        }

        // Create sale items
        const saleItemsPromises = sale.items.map(async (item) => {
          let productId = item.id;
          
          // If the product ID is not a valid UUID, look up the product by name
          if (!isValidUUID(item.id)) {
            const { data: productData } = await supabase
              .from('products')
              .select('id')
              .eq('name', item.name)
              .maybeSingle();

            if (!productData) {
              throw new Error(`Product "${item.name}" not found in database`);
            }
            productId = productData.id;
          }

          return {
            sale_id: saleData.id,
            product_id: productId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.quantity * item.price,
            sync_status: 'synced' as const
          };
        });

        const saleItems = await Promise.all(saleItemsPromises);
        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) {
          errors.push(`Failed to sync sale items: ${itemsError.message}`);
          continue;
        }

        // If credit sale, create credit transaction
        if (sale.paymentType === 'credit' && sale.customer) {
          const { error: creditError } = await supabase
            .from('credit_transactions')
            .insert({
              customer_id: sale.customer.id,
              sale_id: saleData.id,
              transaction_type: 'sale',
              amount: sale.total,
              transaction_date: sale.timestamp.toISOString(),
              notes: `Credit sale - ${sale.items.length} items`,
              sync_status: 'synced'
            });

          if (creditError) {
            errors.push(`Failed to create credit transaction: ${creditError.message}`);
            continue;
          }
        }

        // Mark as synced in localStorage
        const updatedSales = sales.map(s => 
          s.id === sale.id ? { ...s, synced: true } : s
        );
        localStorage.setItem('sales', JSON.stringify(updatedSales));
        synced++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync sale: ${errorMsg}`);
      }
    }

    return { success: errors.length === 0, errors, synced };
  }
};
