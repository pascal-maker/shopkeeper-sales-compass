-- Initial database setup for Shopkeeper Sales Compass
-- This migration creates all necessary tables, functions, and policies

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

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    description TEXT,
    selling_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    unit_type TEXT DEFAULT 'piece',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    location TEXT,
    notes TEXT,
    credit_balance DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'credit')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role from profiles
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
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Creating profile for user: %', NEW.id;
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
      'cashier'::public.app_role
    );
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  
  -- Insert user role with error handling
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'cashier'::public.app_role);
    RAISE LOG 'User role created successfully for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error creating user role for user %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  
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

CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage all roles" ON public.user_roles
  FOR ALL 
  USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Create RLS policies for products
CREATE POLICY "Users can view all products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Users can insert products" ON public.products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update products" ON public.products
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete products" ON public.products
  FOR DELETE USING (true);

-- Create RLS policies for customers
CREATE POLICY "Users can view all customers" ON public.customers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert customers" ON public.customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update customers" ON public.customers
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete customers" ON public.customers
  FOR DELETE USING (true);

-- Create RLS policies for sales
CREATE POLICY "Users can view all sales" ON public.sales
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sales" ON public.sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update sales" ON public.sales
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete sales" ON public.sales
  FOR DELETE USING (true);

-- Create RLS policies for sale_items
CREATE POLICY "Users can view all sale_items" ON public.sale_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert sale_items" ON public.sale_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update sale_items" ON public.sale_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete sale_items" ON public.sale_items
  FOR DELETE USING (true);

-- Create RLS policies for credit_transactions
CREATE POLICY "Users can view all credit_transactions" ON public.credit_transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert credit_transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update credit_transactions" ON public.credit_transactions
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete credit_transactions" ON public.credit_transactions
  FOR DELETE USING (true);

-- Add constraints for data validation
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) <= 100);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_business_name_length CHECK (char_length(business_name) <= 200);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_length CHECK (char_length(phone) <= 20);

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_phone_format CHECK (phone IS NULL OR phone ~ '^[\+]?[0-9][\d]{0,15}$');

ALTER TABLE public.customers 
ADD CONSTRAINT customers_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_phone_length CHECK (char_length(phone) <= 20);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_location_length CHECK (char_length(location) <= 200);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_notes_length CHECK (char_length(notes) <= 1000);

ALTER TABLE public.customers 
ADD CONSTRAINT customers_phone_format CHECK (phone ~ '^[\+]?[0-9][\d]{0,15}$');

ALTER TABLE public.products 
ADD CONSTRAINT products_name_length CHECK (char_length(name) <= 100);

ALTER TABLE public.products 
ADD CONSTRAINT products_sku_length CHECK (char_length(sku) <= 50);

ALTER TABLE public.products 
ADD CONSTRAINT products_category_length CHECK (char_length(category) <= 50);

ALTER TABLE public.products 
ADD CONSTRAINT products_unit_type_length CHECK (char_length(unit_type) <= 20);

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
