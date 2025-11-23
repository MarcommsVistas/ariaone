-- Add preferred_version column to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN preferred_version TEXT DEFAULT 'v1' CHECK (preferred_version IN ('v1', 'v2'));

-- Add workflow_version column to template_instances table
ALTER TABLE public.template_instances 
ADD COLUMN workflow_version TEXT DEFAULT 'v1' CHECK (workflow_version IN ('v1', 'v2'));

-- Update RLS policy to allow users to update their own preferred_version
CREATE POLICY "Users can update their own preferred version"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);