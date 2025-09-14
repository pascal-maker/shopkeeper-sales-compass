-- Add expiry_date column to products table
-- This column is expected by the application but missing from the database schema

ALTER TABLE public.products 
ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE;

-- Add any other missing columns that might be needed
ALTER TABLE public.products 
ADD COLUMN sync_status TEXT DEFAULT 'synced';

-- Add user_id column to products table for RLS
ALTER TABLE public.products 
ADD COLUMN user_id UUID REFERENCES auth.users(id);
