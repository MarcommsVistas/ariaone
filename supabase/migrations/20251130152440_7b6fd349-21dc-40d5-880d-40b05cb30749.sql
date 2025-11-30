-- Create function to notify marcomms users when HR submits a creative review
CREATE OR REPLACE FUNCTION public.notify_marcomms_on_review_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  marcomms_user RECORD;
  instance_name TEXT;
  submitter_email TEXT;
BEGIN
  -- Get instance name
  SELECT name INTO instance_name
  FROM template_instances
  WHERE id = NEW.instance_id;
  
  -- Get submitter email
  SELECT email INTO submitter_email
  FROM auth.users
  WHERE id = NEW.submitted_by;
  
  -- Create notifications for all marcomms users
  FOR marcomms_user IN 
    SELECT user_id 
    FROM user_roles 
    WHERE role = 'marcomms'
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      marcomms_user.user_id,
      'review_submitted',
      'New Creative Review Submitted',
      submitter_email || ' submitted "' || instance_name || '" for review',
      jsonb_build_object(
        'instance_id', NEW.instance_id,
        'review_id', NEW.id,
        'submitted_by', NEW.submitted_by
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for review submissions
DROP TRIGGER IF EXISTS on_review_submitted ON creative_reviews;
CREATE TRIGGER on_review_submitted
  AFTER INSERT ON creative_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_marcomms_on_review_submission();

-- Create function to notify marcomms users when HR requests deletion
CREATE OR REPLACE FUNCTION public.notify_marcomms_on_deletion_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  marcomms_user RECORD;
  instance_name TEXT;
  submitter_email TEXT;
BEGIN
  -- Only notify if deletion_requested changed to true
  IF NEW.deletion_requested = true AND (OLD.deletion_requested IS NULL OR OLD.deletion_requested = false) THEN
    -- Get instance name
    SELECT name INTO instance_name
    FROM template_instances
    WHERE id = NEW.instance_id;
    
    -- Get submitter email
    SELECT email INTO submitter_email
    FROM auth.users
    WHERE id = NEW.submitted_by;
    
    -- Create notifications for all marcomms users
    FOR marcomms_user IN 
      SELECT user_id 
      FROM user_roles 
      WHERE role = 'marcomms'
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        marcomms_user.user_id,
        'deletion_requested',
        'Creative Deletion Requested',
        submitter_email || ' requested deletion of "' || instance_name || '"',
        jsonb_build_object(
          'instance_id', NEW.instance_id,
          'review_id', NEW.id,
          'submitted_by', NEW.submitted_by,
          'deletion_notes', NEW.deletion_request_notes
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for deletion requests
DROP TRIGGER IF EXISTS on_deletion_requested ON creative_reviews;
CREATE TRIGGER on_deletion_requested
  AFTER UPDATE ON creative_reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_marcomms_on_deletion_request();