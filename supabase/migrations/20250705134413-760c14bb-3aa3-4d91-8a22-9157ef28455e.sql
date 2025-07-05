-- Create function to log sync changes
CREATE OR REPLACE FUNCTION public.log_sync_change()
RETURNS TRIGGER AS $$
DECLARE
    record_id UUID;
BEGIN
    -- Determine whether the operation is DELETE or not to get the right ID
    IF TG_OP = 'DELETE' THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;

    -- Insert log into sync_log
    INSERT INTO public.sync_log (
        table_name,
        record_id,
        operation,
        sync_status,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        record_id,
        TG_OP,
        'pending',
        NOW()
    );

    -- Return the appropriate row depending on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to customers table
CREATE TRIGGER trigger_log_customers_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Add triggers to products table
CREATE TRIGGER trigger_log_products_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Add triggers to sales table
CREATE TRIGGER trigger_log_sales_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Add triggers to sale_items table
CREATE TRIGGER trigger_log_sale_items_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Add triggers to credit_transactions table
CREATE TRIGGER trigger_log_credit_transactions_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Add triggers to inventory_adjustments table
CREATE TRIGGER trigger_log_inventory_adjustments_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_adjustments
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();