-- Add missing columns to products table to match application expectations
-- The application expects camelCase column names but database has snake_case

-- Add camelCase versions of existing columns
ALTER TABLE public.products 
ADD COLUMN "sellingPrice" DECIMAL(10,2);

ALTER TABLE public.products 
ADD COLUMN "costPrice" DECIMAL(10,2);

ALTER TABLE public.products 
ADD COLUMN "unitType" TEXT;

-- Copy data from existing columns to new camelCase columns
UPDATE public.products 
SET "sellingPrice" = selling_price,
    "costPrice" = cost_price,
    "unitType" = unit_type;

-- Add other missing columns that the application might need
ALTER TABLE public.products 
ADD COLUMN "expiryDate" TIMESTAMP WITH TIME ZONE;

-- Copy expiry_date to expiryDate
UPDATE public.products 
SET "expiryDate" = expiry_date;
