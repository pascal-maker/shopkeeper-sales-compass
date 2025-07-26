-- Security Fix 6: Critical Role Escalation Protection - Create new profile update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;

-- Create new policy that prevents role updates except by admins
CREATE POLICY "Users can update profile data only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR 
   get_user_role(auth.uid()) = 'admin'::app_role)
);

-- Security Fix 7: Secure user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage all roles" ON public.user_roles;

-- Users can only view their own roles
CREATE POLICY "Users view own roles only" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only admins can manage all roles
CREATE POLICY "Admins manage all roles" 
ON public.user_roles 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::app_role);