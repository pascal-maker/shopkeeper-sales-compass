-- Recreate the function with explicit schema references to avoid search_path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'cashier'::public.app_role
  );
  
  -- Add default role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cashier'::public.app_role);
  
  RETURN NEW;
END;
$$;