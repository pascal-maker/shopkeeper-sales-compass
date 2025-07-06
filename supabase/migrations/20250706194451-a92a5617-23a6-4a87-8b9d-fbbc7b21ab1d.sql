-- Create function to handle new user signup (this might be missing)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'cashier'::app_role
  );
  
  -- Add default role to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'cashier'::app_role);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup (this might be missing)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();