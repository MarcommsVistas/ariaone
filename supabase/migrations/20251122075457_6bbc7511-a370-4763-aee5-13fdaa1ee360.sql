-- Create storage bucket for custom fonts
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-fonts', 'custom-fonts', false);

-- Create table to track font metadata
CREATE TABLE public.custom_fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  family text NOT NULL,
  weight integer DEFAULT 400,
  style text DEFAULT 'normal',
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, family)
);

-- Enable RLS
ALTER TABLE public.custom_fonts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_fonts table
CREATE POLICY "Users can view their own fonts"
ON public.custom_fonts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fonts"
ON public.custom_fonts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fonts"
ON public.custom_fonts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Storage policies for custom-fonts bucket
CREATE POLICY "Users can upload their own fonts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'custom-fonts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own fonts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'custom-fonts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own fonts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'custom-fonts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);