-- Drop the existing restrictive policy for template_instances INSERT
DROP POLICY IF EXISTS "HR can create their own instances" ON template_instances;

-- Create a new policy that allows both HR and marcomms to create instances
CREATE POLICY "HR and Marcomms can create their own instances" 
ON template_instances 
FOR INSERT 
WITH CHECK (
  (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'marcomms'::app_role)) 
  AND created_by = auth.uid()
);