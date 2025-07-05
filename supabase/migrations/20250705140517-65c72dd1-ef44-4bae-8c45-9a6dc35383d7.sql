-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'cashier', 'manager');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'cashier',
    business_name TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Add user_id columns to existing tables
ALTER TABLE public.customers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.credit_transactions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.inventory_adjustments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create audit trail table
CREATE TABLE public.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'cashier'::app_role
  );
  
  -- Add default role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cashier'::app_role);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for audit_trail
CREATE POLICY "Users can view their own audit trail" ON public.audit_trail
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit trails" ON public.audit_trail
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can insert audit records" ON public.audit_trail
  FOR INSERT WITH CHECK (true);

-- Update RLS policies for existing tables to be user-specific

-- Customers policies
DROP POLICY IF EXISTS "Enable all operations for customers" ON public.customers;
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customers" ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- Products policies
DROP POLICY IF EXISTS "Enable all operations for products" ON public.products;
CREATE POLICY "Users can view their own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Sales policies
DROP POLICY IF EXISTS "Enable all operations for sales" ON public.sales;
CREATE POLICY "Users can view their own sales" ON public.sales
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sales" ON public.sales
  FOR UPDATE USING (auth.uid() = user_id);

-- Sale items policies
DROP POLICY IF EXISTS "Enable all operations for sale_items" ON public.sale_items;
CREATE POLICY "Users can view their own sale items" ON public.sale_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  ));
CREATE POLICY "Users can create their own sale items" ON public.sale_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.sales 
    WHERE sales.id = sale_items.sale_id 
    AND sales.user_id = auth.uid()
  ));

-- Credit transactions policies
DROP POLICY IF EXISTS "Enable all operations for credit_transactions" ON public.credit_transactions;
CREATE POLICY "Users can view their own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credit transactions" ON public.credit_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Inventory adjustments policies
DROP POLICY IF EXISTS "Enable all operations for inventory_adjustments" ON public.inventory_adjustments;
CREATE POLICY "Users can view their own inventory adjustments" ON public.inventory_adjustments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own inventory adjustments" ON public.inventory_adjustments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_inventory_adjustments_user_id ON public.inventory_adjustments(user_id);
CREATE INDEX idx_audit_trail_user_id ON public.audit_trail(user_id);
CREATE INDEX idx_audit_trail_table_record ON public.audit_trail(table_name, record_id);

-- Create function to log audit trail
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit trail triggers to all main tables
CREATE TRIGGER audit_customers_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_products_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_sales_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_credit_transactions_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.credit_transactions
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();

CREATE TRIGGER audit_inventory_adjustments_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_adjustments
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();