-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES public.template_instances(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_category text NOT NULL,
  performed_by uuid NOT NULL,
  performed_at timestamp with time zone NOT NULL DEFAULT now(),
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_instance ON public.audit_logs(instance_id);
CREATE INDEX idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_performed_at ON public.audit_logs(performed_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Marcomms can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'marcomms'));

CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Function to get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id;
$$;

-- Helper function for logging
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _instance_id uuid,
  _event_type text,
  _event_category text,
  _performed_by uuid,
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _old_value jsonb DEFAULT NULL,
  _new_value jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    instance_id, event_type, event_category, performed_by,
    entity_type, entity_id, old_value, new_value, metadata
  ) VALUES (
    _instance_id, _event_type, _event_category, _performed_by,
    _entity_type, _entity_id, _old_value, _new_value, _metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to fetch logs with emails
CREATE OR REPLACE FUNCTION public.get_audit_logs_with_emails(
  _instance_id uuid DEFAULT NULL,
  _event_category text DEFAULT NULL,
  _event_type text DEFAULT NULL,
  _performed_by uuid DEFAULT NULL,
  _start_date timestamp with time zone DEFAULT NULL,
  _end_date timestamp with time zone DEFAULT NULL,
  _limit integer DEFAULT 100,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  instance_id uuid,
  instance_name text,
  event_type text,
  event_category text,
  performed_by uuid,
  performed_by_email text,
  performed_at timestamp with time zone,
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    al.id,
    al.instance_id,
    ti.name as instance_name,
    al.event_type,
    al.event_category,
    al.performed_by,
    au.email as performed_by_email,
    al.performed_at,
    al.entity_type,
    al.entity_id,
    al.old_value,
    al.new_value,
    al.metadata
  FROM public.audit_logs al
  LEFT JOIN public.template_instances ti ON ti.id = al.instance_id
  LEFT JOIN auth.users au ON au.id = al.performed_by
  WHERE 
    (_instance_id IS NULL OR al.instance_id = _instance_id)
    AND (_event_category IS NULL OR al.event_category = _event_category)
    AND (_event_type IS NULL OR al.event_type = _event_type)
    AND (_performed_by IS NULL OR al.performed_by = _performed_by)
    AND (_start_date IS NULL OR al.performed_at >= _start_date)
    AND (_end_date IS NULL OR al.performed_at <= _end_date)
  ORDER BY al.performed_at DESC
  LIMIT _limit
  OFFSET _offset;
$$;

-- Trigger for template_instances changes
CREATE OR REPLACE FUNCTION public.track_instance_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.log_audit_event(
      NEW.id,
      'project_created',
      'project',
      NEW.created_by,
      'instance',
      NEW.id,
      NULL,
      to_jsonb(NEW),
      jsonb_build_object('name', NEW.name, 'brand', NEW.brand, 'category', NEW.category)
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Track caption updates
    IF (OLD.caption_copy IS DISTINCT FROM NEW.caption_copy) THEN
      PERFORM public.log_audit_event(
        NEW.id,
        'caption_updated',
        'content',
        COALESCE(auth.uid(), NEW.created_by),
        'caption',
        NEW.id,
        jsonb_build_object('caption', OLD.caption_copy),
        jsonb_build_object('caption', NEW.caption_copy),
        NULL
      );
    END IF;
    
    -- Track other instance updates
    IF (OLD.name IS DISTINCT FROM NEW.name OR 
        OLD.brand IS DISTINCT FROM NEW.brand OR 
        OLD.category IS DISTINCT FROM NEW.category) THEN
      PERFORM public.log_audit_event(
        NEW.id,
        'project_updated',
        'project',
        COALESCE(auth.uid(), NEW.created_by),
        'instance',
        NEW.id,
        jsonb_build_object('name', OLD.name, 'brand', OLD.brand, 'category', OLD.category),
        jsonb_build_object('name', NEW.name, 'brand', NEW.brand, 'category', NEW.category),
        NULL
      );
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.log_audit_event(
      OLD.id,
      'project_deleted',
      'project',
      COALESCE(auth.uid(), OLD.created_by),
      'instance',
      OLD.id,
      to_jsonb(OLD),
      NULL,
      jsonb_build_object('name', OLD.name)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER track_instance_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.template_instances
FOR EACH ROW EXECUTE FUNCTION public.track_instance_changes();

-- Trigger for layers changes
CREATE OR REPLACE FUNCTION public.track_layer_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _instance_id uuid;
BEGIN
  -- Get instance_id from slide
  SELECT s.instance_id INTO _instance_id
  FROM public.slides s
  WHERE s.id = COALESCE(NEW.slide_id, OLD.slide_id);
  
  IF _instance_id IS NOT NULL THEN
    IF (TG_OP = 'UPDATE' AND OLD.text_content IS DISTINCT FROM NEW.text_content) THEN
      PERFORM public.log_audit_event(
        _instance_id,
        'layer_updated',
        'content',
        COALESCE(auth.uid(), (SELECT created_by FROM public.template_instances WHERE id = _instance_id)),
        'layer',
        NEW.id,
        jsonb_build_object('text_content', OLD.text_content, 'layer_name', OLD.name),
        jsonb_build_object('text_content', NEW.text_content, 'layer_name', NEW.name),
        NULL
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_layer_changes_trigger
AFTER UPDATE ON public.layers
FOR EACH ROW EXECUTE FUNCTION public.track_layer_changes();

-- Enable realtime for audit_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;