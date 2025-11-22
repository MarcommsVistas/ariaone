-- Fix user_roles table security: Require authentication for viewing roles
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create updated policy with explicit authentication check
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);