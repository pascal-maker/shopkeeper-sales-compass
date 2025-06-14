
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE payment_type AS ENUM ('cash', 'mobile_money', 'credit');
CREATE TYPE transaction_type AS ENUM ('sale', 'payment', 'adjustment');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed');

-- Create customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'pending',
    local_id TEXT, -- For offline sync mapping
    UNIQUE(phone)
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    unit_type TEXT DEFAULT 'piece',
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 0 CHECK (quantity >= 0),
    min_stock_level INTEGER DEFAULT 10,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'pending',
    local_id TEXT
);

-- Create sales table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_type payment_type NOT NULL,
    notes TEXT,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'pending',
    local_id TEXT
);

-- Create sale_items table (line items for each sale)
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'pending',
    local_id TEXT
);

-- Create credit_transactions table (for tracking customer credit/payments)
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL, -- Link to sale if it's a credit sale
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'pending',
    local_id TEXT
);

-- Create inventory_adjustments table (for stock adjustments)
CREATE TABLE public.inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    adjustment_quantity INTEGER NOT NULL, -- Can be positive or negative
    reason TEXT,
    notes TEXT,
    adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status sync_status DEFAULT 'pending',
    local_id TEXT
);

-- Create sync_log table (for tracking sync operations)
CREATE TABLE public.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    operation TEXT NOT NULL, -- 'insert', 'update', 'delete'
    sync_status sync_status DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing public access for now, can be restricted later with auth)
CREATE POLICY "Enable all operations for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for sale_items" ON public.sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for credit_transactions" ON public.credit_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for inventory_adjustments" ON public.inventory_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for sync_log" ON public.sync_log FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_sync_status ON public.customers(sync_status);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_sync_status ON public.products(sync_status);
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX idx_sales_sync_status ON public.sales(sync_status);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);
CREATE INDEX idx_credit_transactions_customer_id ON public.credit_transactions(customer_id);
CREATE INDEX idx_credit_transactions_date ON public.credit_transactions(transaction_date);
CREATE INDEX idx_inventory_adjustments_product_id ON public.inventory_adjustments(product_id);
CREATE INDEX idx_sync_log_table_record ON public.sync_log(table_name, record_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update product quantity after sales
CREATE OR REPLACE FUNCTION update_product_quantity_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease product quantity when sale item is inserted
    IF TG_OP = 'INSERT' THEN
        UPDATE public.products 
        SET quantity = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
    
    -- Handle updates to sale items
    IF TG_OP = 'UPDATE' THEN
        -- Restore old quantity and subtract new quantity
        UPDATE public.products 
        SET quantity = quantity + OLD.quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
    
    -- Restore quantity when sale item is deleted
    IF TG_OP = 'DELETE' THEN
        UPDATE public.products 
        SET quantity = quantity + OLD.quantity,
            updated_at = NOW()
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic inventory updates
CREATE TRIGGER trigger_update_product_quantity 
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION update_product_quantity_on_sale();

-- Create function to apply inventory adjustments
CREATE OR REPLACE FUNCTION apply_inventory_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product quantity based on adjustment
    UPDATE public.products 
    SET quantity = quantity + NEW.adjustment_quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory adjustments
CREATE TRIGGER trigger_apply_inventory_adjustment 
    AFTER INSERT ON public.inventory_adjustments
    FOR EACH ROW EXECUTE FUNCTION apply_inventory_adjustment();

-- Create view for customer credit balances
CREATE VIEW public.customer_credit_balances AS
SELECT 
    c.id,
    c.name,
    c.phone,
    COALESCE(
        (SELECT SUM(CASE 
            WHEN ct.transaction_type = 'sale' THEN ct.amount 
            WHEN ct.transaction_type = 'payment' THEN -ct.amount 
            ELSE 0 
        END)
        FROM public.credit_transactions ct 
        WHERE ct.customer_id = c.id), 0
    ) AS credit_balance,
    (SELECT MAX(ct.transaction_date) 
     FROM public.credit_transactions ct 
     WHERE ct.customer_id = c.id AND ct.transaction_type = 'sale') AS last_credit_date,
    (SELECT MAX(ct.transaction_date) 
     FROM public.credit_transactions ct 
     WHERE ct.customer_id = c.id AND ct.transaction_type = 'payment') AS last_payment_date
FROM public.customers c;

-- Create view for low stock products
CREATE VIEW public.low_stock_products AS
SELECT 
    p.*,
    (p.min_stock_level - p.quantity) AS shortage_quantity
FROM public.products p
WHERE p.quantity <= p.min_stock_level;

-- Create view for daily sales summary
CREATE VIEW public.daily_sales_summary AS
SELECT 
    DATE(sale_date) as sale_date,
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    COUNT(CASE WHEN payment_type = 'cash' THEN 1 END) as cash_sales,
    COUNT(CASE WHEN payment_type = 'mobile_money' THEN 1 END) as mobile_money_sales,
    COUNT(CASE WHEN payment_type = 'credit' THEN 1 END) as credit_sales,
    SUM(CASE WHEN payment_type = 'cash' THEN total_amount ELSE 0 END) as cash_revenue,
    SUM(CASE WHEN payment_type = 'mobile_money' THEN total_amount ELSE 0 END) as mobile_money_revenue,
    SUM(CASE WHEN payment_type = 'credit' THEN total_amount ELSE 0 END) as credit_revenue
FROM public.sales
GROUP BY DATE(sale_date)
ORDER BY sale_date DESC;
