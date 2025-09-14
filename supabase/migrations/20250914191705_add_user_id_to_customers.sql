-- Add user_id column to customers table
-- This column is expected by the application but missing from the database schema

ALTER TABLE public.customers 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add sync_status column to customers table for consistency
ALTER TABLE public.customers 
ADD COLUMN sync_status TEXT DEFAULT 'synced';
