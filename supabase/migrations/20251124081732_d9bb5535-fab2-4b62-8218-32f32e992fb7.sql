-- Add deletion tracking columns to creative_reviews table
ALTER TABLE public.creative_reviews 
ADD COLUMN deletion_requested boolean DEFAULT false,
ADD COLUMN deletion_requested_at timestamp with time zone,
ADD COLUMN deletion_request_notes text;

-- Update RLS policy for template_instances to prevent HR from deleting approved projects
DROP POLICY IF EXISTS "HR can delete their own instances" ON public.template_instances;

CREATE POLICY "HR can delete their own instances" 
ON public.template_instances 
FOR DELETE 
USING (
  has_role(auth.uid(), 'hr'::app_role) 
  AND created_by = auth.uid()
  AND (
    -- Can delete if no review exists
    NOT EXISTS (
      SELECT 1 FROM public.creative_reviews 
      WHERE instance_id = template_instances.id
    )
    OR
    -- Can delete if review is not approved
    EXISTS (
      SELECT 1 FROM public.creative_reviews 
      WHERE instance_id = template_instances.id 
      AND status != 'approved'
    )
    OR
    -- Can delete if approved but marcomms approved the deletion
    EXISTS (
      SELECT 1 FROM public.creative_reviews 
      WHERE instance_id = template_instances.id 
      AND status = 'approved' 
      AND deletion_requested = false
      AND reviewed_by IS NOT NULL
    )
  )
);