-- Add DELETE RLS policy for marcomms on template_instances
CREATE POLICY "Marcomms can delete instances"
ON template_instances
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'marcomms'::app_role));