-- Security Fix 8: Add length constraints to prevent buffer overflow attacks
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) <= 100);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_business_name_length CHECK (char_length(business_name) <= 200);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_length CHECK (char_length(phone) <= 20);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_phone_length CHECK (char_length(phone) <= 20);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_location_length CHECK (char_length(location) <= 200);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_notes_length CHECK (char_length(notes) <= 1000);

ALTER TABLE public.products 
ADD CONSTRAINT products_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.products 
ADD CONSTRAINT products_sku_length CHECK (char_length(sku) <= 50);

ALTER TABLE public.products 
ADD CONSTRAINT products_category_length CHECK (char_length(category) <= 50);

ALTER TABLE public.products 
ADD CONSTRAINT products_unit_type_length CHECK (char_length(unit_type) <= 20);

-- Security Fix 9: Add phone number format validation (updated to allow numbers starting with 0)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^[\+]?[0-9][\d]{0,15}$');

ALTER TABLE public.customers 
ADD CONSTRAINT customers_phone_format CHECK (phone ~ '^[\+]?[0-9][\d]{0,15}$');

-- Security Fix 10: Add business logic constraints
ALTER TABLE public.products 
ADD CONSTRAINT products_positive_prices CHECK (selling_price > 0 AND (cost_price IS NULL OR cost_price >= 0));

ALTER TABLE public.products 
ADD CONSTRAINT products_positive_quantity CHECK (quantity >= 0);

ALTER TABLE public.products 
ADD CONSTRAINT products_positive_min_stock CHECK (min_stock_level >= 0);

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_positive_amount CHECK (amount > 0);

ALTER TABLE public.sales 
ADD CONSTRAINT sales_positive_amount CHECK (total_amount > 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT sale_items_positive_values CHECK (quantity > 0 AND unit_price > 0 AND total_price > 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT sale_items_total_calculation CHECK (ABS(total_price - (quantity * unit_price)) < 0.01);