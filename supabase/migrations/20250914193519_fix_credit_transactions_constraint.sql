-- Fix credit_transactions constraint issue
-- The application is trying to insert 'sale' as transaction_type but there might be a constraint

-- First, let's drop any existing check constraints on transaction_type
ALTER TABLE public.credit_transactions 
DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;

-- Create a new constraint that allows the values the application needs
ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_transaction_type_check 
CHECK (transaction_type IN ('sale', 'payment', 'refund', 'adjustment'));

-- If the constraint still fails, let's make transaction_type nullable temporarily
-- ALTER TABLE public.credit_transactions 
-- ALTER COLUMN transaction_type DROP NOT NULL;
