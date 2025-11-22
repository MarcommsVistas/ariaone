-- Create template_instances table
CREATE TABLE public.template_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  brand TEXT,
  category TEXT
);

-- Enable RLS on template_instances
ALTER TABLE public.template_instances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for template_instances
CREATE POLICY "HR can view their own instances"
ON public.template_instances
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) AND created_by = auth.uid());

CREATE POLICY "HR can create their own instances"
ON public.template_instances
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) AND created_by = auth.uid());

CREATE POLICY "HR can update their own instances"
ON public.template_instances
FOR UPDATE
USING (has_role(auth.uid(), 'hr'::app_role) AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) AND created_by = auth.uid());

CREATE POLICY "HR can delete their own instances"
ON public.template_instances
FOR DELETE
USING (has_role(auth.uid(), 'hr'::app_role) AND created_by = auth.uid());

-- Modify slides table to support instances
ALTER TABLE public.slides 
ADD COLUMN instance_id UUID REFERENCES public.template_instances(id) ON DELETE CASCADE;

-- Make template_id nullable since slides can belong to instances
ALTER TABLE public.slides ALTER COLUMN template_id DROP NOT NULL;

-- Add constraint: must have either template_id OR instance_id
ALTER TABLE public.slides ADD CONSTRAINT slides_parent_check 
CHECK (
  (template_id IS NOT NULL AND instance_id IS NULL) OR 
  (template_id IS NULL AND instance_id IS NOT NULL)
);

-- Create RLS policies for slides belonging to instances
CREATE POLICY "HR can view slides of their instances"
ON public.slides
FOR SELECT
USING (
  instance_id IS NOT NULL AND
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.template_instances 
    WHERE template_instances.id = slides.instance_id 
    AND template_instances.created_by = auth.uid()
  )
);

CREATE POLICY "HR can create slides for their instances"
ON public.slides
FOR INSERT
WITH CHECK (
  instance_id IS NOT NULL AND
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.template_instances 
    WHERE template_instances.id = slides.instance_id 
    AND template_instances.created_by = auth.uid()
  )
);

CREATE POLICY "HR can update slides of their instances"
ON public.slides
FOR UPDATE
USING (
  instance_id IS NOT NULL AND
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.template_instances 
    WHERE template_instances.id = slides.instance_id 
    AND template_instances.created_by = auth.uid()
  )
)
WITH CHECK (
  instance_id IS NOT NULL AND
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.template_instances 
    WHERE template_instances.id = slides.instance_id 
    AND template_instances.created_by = auth.uid()
  )
);

CREATE POLICY "HR can delete slides of their instances"
ON public.slides
FOR DELETE
USING (
  instance_id IS NOT NULL AND
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.template_instances 
    WHERE template_instances.id = slides.instance_id 
    AND template_instances.created_by = auth.uid()
  )
);

-- Create RLS policies for layers belonging to instance slides
CREATE POLICY "HR can view layers of their instance slides"
ON public.layers
FOR SELECT
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.template_instances ON template_instances.id = slides.instance_id
    WHERE slides.id = layers.slide_id 
    AND template_instances.created_by = auth.uid()
  )
);

CREATE POLICY "HR can create layers for their instance slides"
ON public.layers
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.template_instances ON template_instances.id = slides.instance_id
    WHERE slides.id = layers.slide_id 
    AND template_instances.created_by = auth.uid()
  )
);

CREATE POLICY "HR can update layers of their instance slides"
ON public.layers
FOR UPDATE
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.template_instances ON template_instances.id = slides.instance_id
    WHERE slides.id = layers.slide_id 
    AND template_instances.created_by = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.template_instances ON template_instances.id = slides.instance_id
    WHERE slides.id = layers.slide_id 
    AND template_instances.created_by = auth.uid()
  )
);

CREATE POLICY "HR can delete layers of their instance slides"
ON public.layers
FOR DELETE
USING (
  has_role(auth.uid(), 'hr'::app_role) AND 
  EXISTS (
    SELECT 1 FROM public.slides
    JOIN public.template_instances ON template_instances.id = slides.instance_id
    WHERE slides.id = layers.slide_id 
    AND template_instances.created_by = auth.uid()
  )
);

-- Add trigger for updated_at on template_instances
CREATE TRIGGER update_template_instances_updated_at
BEFORE UPDATE ON public.template_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_templates_updated_at();