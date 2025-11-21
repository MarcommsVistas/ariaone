-- Add category column to templates table
ALTER TABLE templates 
ADD COLUMN category TEXT;

-- Add index for faster category filtering
CREATE INDEX idx_templates_category ON templates(category);

-- Create a categories lookup table for predefined categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common template categories
INSERT INTO categories (name, description) VALUES
  ('Social Media', 'Templates for social media posts and ads'),
  ('Email', 'Email newsletter and campaign templates'),
  ('Print', 'Print materials like flyers and brochures'),
  ('Presentation', 'Slide decks and presentation materials'),
  ('Web', 'Web banners and digital ads'),
  ('Video', 'Video thumbnails and graphics');

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories
CREATE POLICY "Everyone can view categories"
ON categories FOR SELECT
TO authenticated
USING (true);

-- Marcomms can manage categories
CREATE POLICY "Marcomms can manage categories"
ON categories FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'marcomms'::app_role))
WITH CHECK (has_role(auth.uid(), 'marcomms'::app_role));