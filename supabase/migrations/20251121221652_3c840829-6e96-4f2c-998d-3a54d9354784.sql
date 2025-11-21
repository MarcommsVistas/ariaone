-- Create role enum for user roles
CREATE TYPE public.app_role AS ENUM ('marcomms', 'hr');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles (users can view their own roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create storage bucket for PSD files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'psd-files',
  'psd-files',
  false,
  52428800, -- 50MB limit
  ARRAY['application/octet-stream', 'image/vnd.adobe.photoshop']
);

-- Storage policies for psd-files bucket
CREATE POLICY "Marcomms can upload PSD files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'psd-files' AND
  public.has_role(auth.uid(), 'marcomms')
);

CREATE POLICY "Marcomms can view PSD files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'psd-files' AND
  public.has_role(auth.uid(), 'marcomms')
);

CREATE POLICY "Marcomms can delete PSD files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'psd-files' AND
  public.has_role(auth.uid(), 'marcomms')
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_published BOOLEAN DEFAULT false NOT NULL,
  psd_file_url TEXT
);

-- Enable RLS on templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Templates RLS policies
CREATE POLICY "Marcomms can manage all templates"
ON public.templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'marcomms'))
WITH CHECK (public.has_role(auth.uid(), 'marcomms'));

CREATE POLICY "HR can view published templates"
ON public.templates
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'hr') AND
  is_published = true
);

-- Create slides table
CREATE TABLE public.slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on slides
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

-- Slides RLS policies
CREATE POLICY "Marcomms can manage all slides"
ON public.slides
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.templates
    WHERE templates.id = slides.template_id
    AND public.has_role(auth.uid(), 'marcomms')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.templates
    WHERE templates.id = slides.template_id
    AND public.has_role(auth.uid(), 'marcomms')
  )
);

CREATE POLICY "HR can view slides of published templates"
ON public.slides
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'hr') AND
  EXISTS (
    SELECT 1 FROM public.templates
    WHERE templates.id = slides.template_id
    AND templates.is_published = true
  )
);

-- Create layers table
CREATE TABLE public.layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID REFERENCES public.slides(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'shape')),
  name TEXT NOT NULL,
  visible BOOLEAN DEFAULT true NOT NULL,
  locked BOOLEAN DEFAULT false NOT NULL,
  z_index INTEGER NOT NULL DEFAULT 0,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 100,
  height INTEGER NOT NULL DEFAULT 100,
  opacity NUMERIC DEFAULT 1.0 NOT NULL,
  rotation NUMERIC DEFAULT 0 NOT NULL,
  text_content TEXT,
  font_family TEXT,
  font_size INTEGER,
  font_weight INTEGER,
  color TEXT,
  text_align TEXT,
  line_height NUMERIC,
  letter_spacing NUMERIC,
  text_transform TEXT,
  max_length INTEGER,
  image_src TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on layers
ALTER TABLE public.layers ENABLE ROW LEVEL SECURITY;

-- Layers RLS policies
CREATE POLICY "Marcomms can manage all layers"
ON public.layers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.templates ON templates.id = slides.template_id
    WHERE slides.id = layers.slide_id
    AND public.has_role(auth.uid(), 'marcomms')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.templates ON templates.id = slides.template_id
    WHERE slides.id = layers.slide_id
    AND public.has_role(auth.uid(), 'marcomms')
  )
);

CREATE POLICY "HR can view layers of published templates"
ON public.layers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'hr') AND
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.templates ON templates.id = slides.template_id
    WHERE slides.id = layers.slide_id
    AND templates.is_published = true
  )
);

CREATE POLICY "HR can update editable layers"
ON public.layers
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'hr') AND
  locked = false AND
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.templates ON templates.id = slides.template_id
    WHERE slides.id = layers.slide_id
    AND templates.is_published = true
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'hr') AND
  locked = false AND
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.templates ON templates.id = slides.template_id
    WHERE slides.id = layers.slide_id
    AND templates.is_published = true
  )
);

-- Create psd_uploads table for tracking
CREATE TABLE public.psd_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on psd_uploads
ALTER TABLE public.psd_uploads ENABLE ROW LEVEL SECURITY;

-- PSD uploads RLS policy
CREATE POLICY "Marcomms can manage PSD upload records"
ON public.psd_uploads
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'marcomms'))
WITH CHECK (public.has_role(auth.uid(), 'marcomms'));

-- Create function to update templates updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for templates updated_at
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_templates_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_templates_created_by ON public.templates(created_by);
CREATE INDEX idx_templates_is_published ON public.templates(is_published);
CREATE INDEX idx_slides_template_id ON public.slides(template_id);
CREATE INDEX idx_slides_order_index ON public.slides(order_index);
CREATE INDEX idx_layers_slide_id ON public.layers(slide_id);
CREATE INDEX idx_layers_z_index ON public.layers(z_index);
CREATE INDEX idx_psd_uploads_template_id ON public.psd_uploads(template_id);