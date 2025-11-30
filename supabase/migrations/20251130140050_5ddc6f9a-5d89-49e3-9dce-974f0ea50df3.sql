-- Create function to get reviews with submitter email addresses
CREATE OR REPLACE FUNCTION public.get_reviews_with_emails()
RETURNS TABLE (
  id uuid,
  instance_id uuid,
  submitted_by uuid,
  submitted_by_email text,
  submitted_at timestamp with time zone,
  status text,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_notes text,
  deletion_requested boolean,
  deletion_requested_at timestamp with time zone,
  deletion_request_notes text,
  change_requests jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  template_instances jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cr.id,
    cr.instance_id,
    cr.submitted_by,
    au.email as submitted_by_email,
    cr.submitted_at,
    cr.status,
    cr.reviewed_at,
    cr.reviewed_by,
    cr.review_notes,
    cr.deletion_requested,
    cr.deletion_requested_at,
    cr.deletion_request_notes,
    cr.change_requests,
    cr.created_at,
    cr.updated_at,
    jsonb_build_object(
      'name', ti.name,
      'brand', ti.brand,
      'category', ti.category,
      'job_description_parsed', ti.job_description_parsed
    ) as template_instances
  FROM public.creative_reviews cr
  LEFT JOIN public.template_instances ti ON ti.id = cr.instance_id
  LEFT JOIN auth.users au ON au.id = cr.submitted_by
  WHERE ti.deleted_at IS NULL
  ORDER BY cr.submitted_at DESC;
$$;