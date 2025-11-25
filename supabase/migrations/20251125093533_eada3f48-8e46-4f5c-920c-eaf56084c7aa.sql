-- Create storage bucket for instance thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('instance-thumbnails', 'instance-thumbnails', true);

-- Create instance_thumbnails table
CREATE TABLE public.instance_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.template_instances(id) ON DELETE CASCADE,
  thumbnail_url TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(instance_id)
);

-- Enable RLS
ALTER TABLE public.instance_thumbnails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instance_thumbnails
CREATE POLICY "HR can view thumbnails of their instances"
  ON public.instance_thumbnails
  FOR SELECT
  USING (
    has_role(auth.uid(), 'hr'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.template_instances
      WHERE id = instance_thumbnails.instance_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Marcomms can view all thumbnails"
  ON public.instance_thumbnails
  FOR SELECT
  USING (has_role(auth.uid(), 'marcomms'::app_role));

CREATE POLICY "System can insert thumbnails"
  ON public.instance_thumbnails
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update thumbnails"
  ON public.instance_thumbnails
  FOR UPDATE
  USING (true);

-- Storage policies for instance-thumbnails bucket
CREATE POLICY "Public can view instance thumbnails"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'instance-thumbnails');

CREATE POLICY "System can upload instance thumbnails"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'instance-thumbnails');

CREATE POLICY "System can update instance thumbnails"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'instance-thumbnails');

-- Index for faster lookups
CREATE INDEX idx_instance_thumbnails_instance_id ON public.instance_thumbnails(instance_id);