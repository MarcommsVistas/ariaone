-- Add brand column to templates table
ALTER TABLE templates 
ADD COLUMN brand TEXT;

-- Add index for faster brand filtering
CREATE INDEX idx_templates_brand ON templates(brand);

-- Create a brands lookup table for predefined brands
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Everyone can view brands
CREATE POLICY "Everyone can view brands"
ON brands FOR SELECT
TO authenticated
USING (true);

-- Marcomms can manage brands
CREATE POLICY "Marcomms can manage brands"
ON brands FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'marcomms'::app_role))
WITH CHECK (has_role(auth.uid(), 'marcomms'::app_role));