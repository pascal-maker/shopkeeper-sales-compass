-- Fix RLS policies to allow proper profile access
-- The current policies are too restrictive and causing 403/406 errors

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create more permissive policies for profiles
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile (for manual creation)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Drop and recreate user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage all roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own roles (for manual creation)
CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- Make sure the get_user_role function works properly
-- Recreate it with better error handling
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = _user_id),
    'cashier'::app_role
  );
$$;
