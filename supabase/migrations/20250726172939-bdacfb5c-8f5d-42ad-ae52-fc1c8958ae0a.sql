-- Security Fix 6: Critical Role Escalation Protection - Prevent users from updating their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policy that prevents role updates
CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  -- Prevent role changes unless user is admin
  (OLD.role = NEW.role OR get_user_role(auth.uid()) = 'admin'::app_role)
);

-- Security Fix 7: Prevent direct role modifications in user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Only allow admins to modify roles, users can only view
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (get_user_role(auth.uid()) = 'admin'::app_role);