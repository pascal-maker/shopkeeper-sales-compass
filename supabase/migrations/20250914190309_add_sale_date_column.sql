-- Add missing sale_date column to sales table
-- This column is expected by the application but was missing from the initial migration

-- Add sale_date column to sales table
ALTER TABLE public.sales 
ADD COLUMN sale_date TIMESTAMP WITH TIME ZONE;

-- Set sale_date to created_at for existing records (if any)
UPDATE public.sales 
SET sale_date = created_at 
WHERE sale_date IS NULL;

-- Make sale_date default to NOW() for new records
ALTER TABLE public.sales 
ALTER COLUMN sale_date SET DEFAULT NOW();

-- Add sale_date column to sale_items table as well (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'sale_date') THEN
    -- Column already exists, do nothing
    NULL;
  ELSE
    ALTER TABLE public.sale_items ADD COLUMN sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;
