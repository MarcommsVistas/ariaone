-- Create brand_images table
CREATE TABLE public.brand_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view brand images (needed for rendering in editor)
CREATE POLICY "Everyone can view brand images"
ON public.brand_images
FOR SELECT
USING (true);

-- Marcomms can insert brand images
CREATE POLICY "Marcomms can insert brand images"
ON public.brand_images
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'marcomms'));

-- Marcomms can delete brand images
CREATE POLICY "Marcomms can delete brand images"
ON public.brand_images
FOR DELETE
USING (has_role(auth.uid(), 'marcomms'));

-- Create storage bucket for brand images
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-images', 'brand-images', true);

-- Storage policies for brand images bucket
CREATE POLICY "Anyone can view brand images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-images');

CREATE POLICY "Marcomms can upload brand images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'brand-images' AND has_role(auth.uid(), 'marcomms'));

CREATE POLICY "Marcomms can delete brand images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'brand-images' AND has_role(auth.uid(), 'marcomms'));