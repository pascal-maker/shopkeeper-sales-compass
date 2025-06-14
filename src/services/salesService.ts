
import { supabase } from "@/integrations/supabase/client";
import { Sale, CartItem } from "@/types/sales";
import { Customer } from "@/types/customer";

export const salesService = {
  async saveSale(sale: Sale): Promise<{ saleId: string; success: boolean; error?: string }> {
    try {
      console.log('SalesService: Saving sale to Supabase:', sale);
      
      // Convert payment type to match database enum
      const paymentTypeMap = {
        'mobile-money': 'mobile_money' as const,
        'cash': 'cash' as const,
        'credit': 'credit' as const
      };
      
      // First, save the sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          total_amount: sale.total,
          payment_type: paymentTypeMap[sale.paymentType],
          customer_id: sale.customer?.id || null,
          sale_date: sale.timestamp.toISOString(),
          sync_status: 'synced' as const
        })
        .select()
        .single();

      if (saleError) {
        console.error('SalesService: Error saving sale:', saleError);
        return { saleId: '', success: false, error: saleError.message };
      }

      console.log('SalesService: Sale saved successfully:', saleData);

      // Save sale items
      const saleItems = sale.items.map(item => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.quantity * item.price,
        sync_status: 'synced' as const
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) {
        console.error('SalesService: Error saving sale items:', itemsError);
        return { saleId: saleData.id, success: false, error: itemsError.message };
      }

      console.log('SalesService: Sale items saved successfully');

      // If it's a credit sale, create a credit transaction
      if (sale.paymentType === 'credit' && sale.customer) {
        console.log('SalesService: Creating credit transaction for customer:', sale.customer.id);
        
        const { error: creditError } = await supabase
          .from('credit_transactions')
          .insert({
            customer_id: sale.customer.id,
            sale_id: saleData.id,
            transaction_type: 'sale' as const,
            amount: sale.total,
            transaction_date: sale.timestamp.toISOString(),
            notes: `Credit sale - ${sale.items.length} items`,
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
      return { saleId: '', success: false, error: 'Unexpected error occurred' };
    }
  }
};
