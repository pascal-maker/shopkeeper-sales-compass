# Database Schema Documentation

## Overview

The application uses PostgreSQL through Supabase with a comprehensive schema designed for a point-of-sale system. The database implements Row Level Security (RLS) for multi-tenant data isolation and includes audit trails, sync logging, and comprehensive business logic through triggers and functions.

## Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   profiles  │    │  customers  │    │   sales     │
│             │    │             │◄───┤             │
│ - id (PK)   │    │ - id (PK)   │    │ - id (PK)   │
│ - email     │    │ - name      │    │ - total     │
│ - role      │    │ - phone     │    │ - date      │
└─────────────┘    │ - location  │    │ - payment   │
                   └─────────────┘    └─────────────┘
                                             │
                                             │
┌─────────────┐    ┌─────────────┐          │
│  products   │    │ sale_items  │◄─────────┘
│             │◄───┤             │
│ - id (PK)   │    │ - id (PK)   │
│ - name      │    │ - quantity  │
│ - price     │    │ - price     │
│ - quantity  │    │ - total     │
│ - category  │    └─────────────┘
└─────────────┘

┌─────────────┐    ┌─────────────────┐
│credit_trans │    │inventory_adj    │
│             │    │                 │
│ - id (PK)   │    │ - id (PK)       │
│ - customer  │    │ - product_id    │
│ - amount    │    │ - adjustment    │
│ - type      │    │ - reason        │
└─────────────┘    └─────────────────┘
```

## Core Tables

### 1. profiles

User profile information with role-based access control.

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  full_name text NOT NULL,
  role app_role NOT NULL DEFAULT 'cashier'::app_role,
  business_name text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- Links to auth.users via id (foreign key)
- Role-based access control with app_role enum
- Automatic profile creation via trigger on user signup
- Business information for multi-business support

**RLS Policies:**
- Users can view and update their own profile
- Admins can view all profiles

### 2. customers

Customer database with contact information and relationship tracking.

```sql
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  location text,
  notes text,
  user_id uuid, -- References auth.users
  local_id text, -- For offline sync
  sync_status sync_status DEFAULT 'pending'::sync_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- Multi-tenant isolation via user_id
- Phone number as natural unique identifier
- Sync status tracking for offline operations
- Local ID for offline-first architecture

**RLS Policies:**
- Users can only access their own customers
- Full CRUD operations for own data

### 3. products

Product catalog with inventory management.

```sql
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sku text,
  category text,
  unit_type text DEFAULT 'piece'::text,
  cost_price numeric,
  selling_price numeric NOT NULL,
  quantity integer DEFAULT 0,
  min_stock_level integer DEFAULT 10,
  expiry_date date,
  user_id uuid, -- References auth.users
  local_id text, -- For offline sync
  sync_status sync_status DEFAULT 'pending'::sync_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- Comprehensive product information
- Inventory tracking with automatic adjustments
- Low stock level monitoring
- Expiry date tracking for perishables
- Multi-unit type support (piece, kg, liter, etc.)

**Business Logic:**
- Automatic quantity updates via triggers when sales are made
- Low stock alerts via view
- Inventory adjustment tracking

### 4. sales

Sales transaction header with customer and payment information.

```sql
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid, -- References customers.id
  total_amount numeric NOT NULL,
  payment_type payment_type NOT NULL,
  notes text,
  sale_date timestamp with time zone DEFAULT now(),
  user_id uuid, -- References auth.users
  local_id text, -- For offline sync
  sync_status sync_status DEFAULT 'pending'::sync_status,
  created_at timestamp with time zone DEFAULT now()
);
```

**Payment Types (Enum):**
- cash
- credit
- mobile_money
- bank_transfer

**Key Features:**
- Links to customers for relationship tracking
- Multiple payment methods
- Automatic timestamps
- Multi-tenant isolation

### 5. sale_items

Individual items within a sale transaction.

```sql
CREATE TABLE public.sale_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id uuid, -- References sales.id
  product_id uuid, -- References products.id
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  local_id text, -- For offline sync
  sync_status sync_status DEFAULT 'pending'::sync_status,
  created_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- Links to both sales and products
- Price tracking at time of sale
- Automatic inventory adjustments via triggers
- Quantity and total calculations

**Business Logic:**
- Automatic product quantity reduction on insert
- Quantity restoration on delete
- Price consistency validation

### 6. credit_transactions

Credit transaction tracking for customer accounts.

```sql
CREATE TABLE public.credit_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid, -- References customers.id
  sale_id uuid, -- References sales.id (optional)
  transaction_type transaction_type NOT NULL,
  amount numeric NOT NULL,
  notes text,
  transaction_date timestamp with time zone DEFAULT now(),
  user_id uuid, -- References auth.users
  local_id text, -- For offline sync
  sync_status sync_status DEFAULT 'pending'::sync_status,
  created_at timestamp with time zone DEFAULT now()
);
```

**Transaction Types (Enum):**
- sale (increases credit balance)
- payment (decreases credit balance)

**Key Features:**
- Links to customers and optionally to sales
- Credit balance calculation via aggregation
- Payment tracking and history

### 7. inventory_adjustments

Manual inventory adjustments for stock corrections.

```sql
CREATE TABLE public.inventory_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid, -- References products.id
  adjustment_quantity integer NOT NULL,
  reason text,
  notes text,
  adjustment_date timestamp with time zone DEFAULT now(),
  user_id uuid, -- References auth.users
  local_id text, -- For offline sync
  sync_status sync_status DEFAULT 'pending'::sync_status,
  created_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- Manual stock level corrections
- Reason tracking for audit purposes
- Automatic application via triggers
- Integration with product quantity

## System Tables

### 8. audit_trail

Comprehensive audit logging for all data changes.

```sql
CREATE TABLE public.audit_trail (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid, -- References auth.users
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);
```

**Key Features:**
- Complete change tracking
- Before/after value storage
- User attribution
- Network information for security

### 9. sync_log

Synchronization tracking for offline-first operations.

```sql
CREATE TABLE public.sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL, -- INSERT, UPDATE, DELETE
  sync_status sync_status DEFAULT 'pending'::sync_status,
  error_message text,
  synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

**Sync Status (Enum):**
- pending
- synced
- failed

### 10. user_roles

Role assignment for fine-grained permissions.

```sql
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL, -- References auth.users
  role app_role NOT NULL,
  granted_at timestamp with time zone DEFAULT now(),
  granted_by uuid, -- References auth.users
  UNIQUE(user_id, role)
);
```

**App Roles (Enum):**
- admin
- manager
- cashier

## Views and Computed Data

### 1. customer_credit_balances

Real-time customer credit balance calculation.

```sql
CREATE VIEW public.customer_credit_balances AS
SELECT 
  c.id,
  c.name,
  c.phone,
  COALESCE(SUM(
    CASE 
      WHEN ct.transaction_type = 'sale' THEN ct.amount
      WHEN ct.transaction_type = 'payment' THEN -ct.amount
    END
  ), 0) as credit_balance,
  MAX(CASE WHEN ct.transaction_type = 'payment' THEN ct.transaction_date END) as last_payment_date,
  MAX(CASE WHEN ct.transaction_type = 'sale' THEN ct.transaction_date END) as last_credit_date
FROM customers c
LEFT JOIN credit_transactions ct ON c.id = ct.customer_id
GROUP BY c.id, c.name, c.phone;
```

### 2. low_stock_products

Products below minimum stock level.

```sql
CREATE VIEW public.low_stock_products AS
SELECT 
  *,
  (min_stock_level - quantity) as shortage_quantity
FROM products 
WHERE quantity <= min_stock_level;
```

### 3. daily_sales_summary

Daily sales aggregation for reporting.

```sql
CREATE VIEW public.daily_sales_summary AS
SELECT 
  DATE(sale_date) as sale_date,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_sales,
  AVG(total_amount) as average_sale,
  payment_type,
  user_id
FROM sales 
GROUP BY DATE(sale_date), payment_type, user_id;
```

## Custom Types (Enums)

```sql
-- Application roles
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier');

-- Payment methods
CREATE TYPE public.payment_type AS ENUM ('cash', 'credit', 'mobile_money', 'bank_transfer');

-- Credit transaction types
CREATE TYPE public.transaction_type AS ENUM ('sale', 'payment');

-- Sync status for offline operations
CREATE TYPE public.sync_status AS ENUM ('pending', 'synced', 'failed');
```

## Database Functions

### 1. handle_new_user()

Automatically creates user profile on signup.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'cashier'::public.app_role
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cashier'::public.app_role);
  
  RETURN NEW;
END;
$$;
```

### 2. log_sync_change()

Tracks all data changes for synchronization.

```sql
CREATE OR REPLACE FUNCTION public.log_sync_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    record_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        record_id := OLD.id;
    ELSE
        record_id := NEW.id;
    END IF;

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

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;
```

### 3. update_product_quantity_on_sale()

Automatically adjusts inventory when sales are made.

```sql
CREATE OR REPLACE FUNCTION public.update_product_quantity_on_sale()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.products 
        SET quantity = quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        UPDATE public.products 
        SET quantity = quantity + OLD.quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        UPDATE public.products 
        SET quantity = quantity + OLD.quantity,
            updated_at = NOW()
        WHERE id = OLD.product_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;
```

### 4. Role Helper Functions

```sql
-- Check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = _user_id
$$;
```

## Triggers

### Data Change Tracking

All business tables have triggers for sync logging:

```sql
-- Products
CREATE TRIGGER trigger_log_products_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Customers
CREATE TRIGGER trigger_log_customers_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Sales
CREATE TRIGGER trigger_log_sales_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();

-- Sale Items
CREATE TRIGGER trigger_log_sale_items_sync_change
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION public.log_sync_change();
```

### Business Logic Triggers

```sql
-- Automatic inventory adjustments
CREATE TRIGGER trigger_update_product_quantity
    AFTER INSERT OR UPDATE OR DELETE ON public.sale_items
    FOR EACH ROW EXECUTE FUNCTION public.update_product_quantity_on_sale();

-- Inventory adjustment application
CREATE TRIGGER trigger_apply_inventory_adjustment
    AFTER INSERT ON public.inventory_adjustments
    FOR EACH ROW EXECUTE FUNCTION public.apply_inventory_adjustment();

-- Audit trail logging
CREATE TRIGGER trigger_audit_trail
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.log_audit_trail();
```

## Row Level Security (RLS)

### Multi-tenant Data Isolation

All business data is isolated by user_id:

```sql
-- Products: Users can only access their own products
CREATE POLICY "Users can view their own products" 
ON public.products FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products" 
ON public.products FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Similar policies for customers, sales, etc.
```

### Role-based Access

```sql
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::app_role);

-- Users can view their own audit trail
CREATE POLICY "Users can view their own audit trail" 
ON public.audit_trail FOR SELECT 
USING (auth.uid() = user_id);
```

## Data Integrity Constraints

### Foreign Key Relationships

```sql
-- Customers belong to users
ALTER TABLE public.customers 
ADD CONSTRAINT customers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- Sales link to customers
ALTER TABLE public.sales 
ADD CONSTRAINT sales_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Sale items link to sales and products
ALTER TABLE public.sale_items 
ADD CONSTRAINT sale_items_sale_id_fkey 
FOREIGN KEY (sale_id) REFERENCES public.sales(id);
```

### Check Constraints

```sql
-- Positive prices and quantities
ALTER TABLE public.products 
ADD CONSTRAINT products_positive_price 
CHECK (selling_price > 0);

ALTER TABLE public.products 
ADD CONSTRAINT products_non_negative_quantity 
CHECK (quantity >= 0);

-- Valid credit transaction amounts
ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_positive_amount 
CHECK (amount > 0);
```

## Indexes for Performance

```sql
-- User data access patterns
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);

-- Search and filtering
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);

-- Date-based queries
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_credit_transactions_date ON public.credit_transactions(transaction_date);

-- Sync operations
CREATE INDEX idx_sync_status ON public.products(sync_status);
CREATE INDEX idx_sync_log_status ON public.sync_log(sync_status);
```

## Migration Strategy

Database changes are managed through Supabase migrations:

1. **Schema Evolution**: Additive changes preferred
2. **Data Migration**: Gradual migration for large tables  
3. **Rollback Support**: All migrations include rollback scripts
4. **Testing**: Migrations tested on staging before production

## Security Considerations

1. **RLS Enforcement**: All tables have appropriate RLS policies
2. **Function Security**: SECURITY DEFINER used carefully
3. **Audit Logging**: Comprehensive change tracking
4. **Data Encryption**: Sensitive data encrypted at rest
5. **Access Control**: Role-based permissions enforced
6. **SQL Injection Prevention**: Parameterized queries only

## Performance Optimization

1. **Indexing Strategy**: Indexes for all common query patterns
2. **Query Optimization**: Regular EXPLAIN ANALYZE reviews
3. **Connection Pooling**: Efficient connection management
4. **Data Archiving**: Historical data archival strategy
5. **Vacuum Strategy**: Regular maintenance scheduling