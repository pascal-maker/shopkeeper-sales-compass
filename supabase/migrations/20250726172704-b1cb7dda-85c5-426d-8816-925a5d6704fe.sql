-- Security Fix 1: Update database functions with proper search_path to prevent SQL injection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'cashier'::public.app_role
  );
  
  -- Add default role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cashier'::public.app_role);
  
  RETURN NEW;
END;
$function$;

-- Security Fix 2: Update has_role function with proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Security Fix 3: Update get_user_role function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
  SELECT role
  FROM public.profiles
  WHERE id = _user_id
$function$;

-- Security Fix 4: Update audit trail function with proper search_path
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE
    user_id_val UUID;
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    -- Get user_id from the record
    IF TG_OP = 'DELETE' THEN
        user_id_val := OLD.user_id;
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        user_id_val := NEW.user_id;
        old_vals := NULL;
        new_vals := to_jsonb(NEW);
    ELSE -- UPDATE
        user_id_val := NEW.user_id;
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    END IF;

    -- Insert audit record
    INSERT INTO public.audit_trail (
        user_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values
    ) VALUES (
        COALESCE(user_id_val, auth.uid()),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_vals,
        new_vals
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- Security Fix 5: Update other functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_quantity_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public', 'pg_temp'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.apply_inventory_adjustment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public', 'pg_temp'
AS $function$
BEGIN
    -- Update product quantity based on adjustment
    UPDATE public.products 
    SET quantity = quantity + NEW.adjustment_quantity,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$function$;

-- Security Fix 6: Critical Role Escalation Protection - Prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that prevents role updates
CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role changes unless user is admin
  (OLD.role = NEW.role OR get_user_role(auth.uid()) = 'admin'::app_role)
);

-- Security Fix 7: Prevent direct role modifications in user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Only allow admins to modify roles, users can only view
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Security Fix 8: Add length constraints to prevent buffer overflow attacks
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) <= 100),
ADD CONSTRAINT profiles_business_name_length CHECK (char_length(business_name) <= 200),
ADD CONSTRAINT profiles_phone_length CHECK (char_length(phone) <= 20);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_name_length CHECK (char_length(name) <= 100),
ADD CONSTRAINT customers_phone_length CHECK (char_length(phone) <= 20),
ADD CONSTRAINT customers_location_length CHECK (char_length(location) <= 200),
ADD CONSTRAINT customers_notes_length CHECK (char_length(notes) <= 1000);

ALTER TABLE public.products 
ADD CONSTRAINT products_name_length CHECK (char_length(name) <= 100),
ADD CONSTRAINT products_sku_length CHECK (char_length(sku) <= 50),
ADD CONSTRAINT products_category_length CHECK (char_length(category) <= 50),
ADD CONSTRAINT products_unit_type_length CHECK (char_length(unit_type) <= 20);

-- Security Fix 9: Add phone number format validation
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^[\+]?[1-9][\d]{0,15}$');

ALTER TABLE public.customers 
ADD CONSTRAINT customers_phone_format CHECK (phone ~ '^[\+]?[1-9][\d]{0,15}$');

-- Security Fix 10: Add business logic constraints
ALTER TABLE public.products 
ADD CONSTRAINT products_positive_prices CHECK (selling_price > 0 AND (cost_price IS NULL OR cost_price >= 0)),
ADD CONSTRAINT products_positive_quantity CHECK (quantity >= 0),
ADD CONSTRAINT products_positive_min_stock CHECK (min_stock_level >= 0);

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_positive_amount CHECK (amount > 0);

ALTER TABLE public.sales 
ADD CONSTRAINT sales_positive_amount CHECK (total_amount > 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT sale_items_positive_values CHECK (quantity > 0 AND unit_price > 0 AND total_price > 0),
ADD CONSTRAINT sale_items_total_calculation CHECK (ABS(total_price - (quantity * unit_price)) < 0.01);