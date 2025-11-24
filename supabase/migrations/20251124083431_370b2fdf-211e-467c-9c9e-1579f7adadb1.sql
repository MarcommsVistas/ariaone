-- Remove foreign key constraint from audit_logs to allow orphaned records after deletion
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_instance_id_fkey;

-- Update HR policy to allow updating deletion_requested field
DROP POLICY IF EXISTS "HR can update their own reviews for deletion requests" ON public.creative_reviews;

CREATE POLICY "HR can update their own reviews for deletion requests"
ON public.creative_reviews
FOR UPDATE
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  submitted_by = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'hr'::app_role) AND 
  submitted_by = auth.uid()
);

-- Clean up duplicate active reviews - keep only the most recent one per instance
WITH ranked_reviews AS (
  SELECT id, 
         instance_id,
         ROW_NUMBER() OVER (PARTITION BY instance_id ORDER BY submitted_at DESC) as rn
  FROM creative_reviews
  WHERE status IN ('pending', 'approved', 'changes_requested')
)
DELETE FROM creative_reviews
WHERE id IN (
  SELECT id FROM ranked_reviews WHERE rn > 1
);

-- Add unique constraint to prevent multiple active reviews per instance
CREATE UNIQUE INDEX unique_active_review_per_instance 
ON public.creative_reviews (instance_id) 
WHERE status IN ('pending', 'approved', 'changes_requested');