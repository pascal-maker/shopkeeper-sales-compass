-- Fix sales table to match what the application expects
-- Add missing columns that the sales service is trying to use

-- Add user_id column to sales table
ALTER TABLE public.sales 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add sync_status column to sales table
ALTER TABLE public.sales 
ADD COLUMN sync_status TEXT DEFAULT 'synced';

-- Rename payment_method to payment_type to match the application
ALTER TABLE public.sales 
RENAME COLUMN payment_method TO payment_type;

-- Add missing columns to sale_items table
ALTER TABLE public.sale_items 
ADD COLUMN sync_status TEXT DEFAULT 'synced';

-- Add missing columns to credit_transactions table
ALTER TABLE public.credit_transactions 
ADD COLUMN sale_id UUID REFERENCES public.sales(id);
ALTER TABLE public.credit_transactions 
ADD COLUMN transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.credit_transactions 
ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.credit_transactions 
ADD COLUMN sync_status TEXT DEFAULT 'synced';

-- transaction_type column already exists, no need to rename
