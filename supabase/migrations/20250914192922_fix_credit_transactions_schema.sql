-- Fix credit_transactions table schema to match what the application expects
-- The application is trying to insert columns that don't exist

-- Add missing columns to credit_transactions table
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS transaction_type TEXT;

ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);

ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';

-- Add sale_id column if it doesn't exist (it was added in a previous migration but let's make sure)
ALTER TABLE public.credit_transactions 
ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES public.sales(id);
