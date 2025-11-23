-- Allow user_id to be NULL for system fonts
ALTER TABLE custom_fonts ALTER COLUMN user_id DROP NOT NULL;

-- Add RLS policy to allow everyone to view system fonts
CREATE POLICY "Anyone can view system fonts"
  ON custom_fonts FOR SELECT
  USING (user_id IS NULL);

-- Add index for better performance when querying system fonts
CREATE INDEX idx_custom_fonts_system ON custom_fonts(user_id) WHERE user_id IS NULL;