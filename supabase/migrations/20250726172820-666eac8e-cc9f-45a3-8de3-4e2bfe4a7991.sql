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