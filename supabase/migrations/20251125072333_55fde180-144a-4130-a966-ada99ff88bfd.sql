-- ============================================================================
-- PART 1: Version History Tracking Tables
-- ============================================================================

-- Create template_versions table
CREATE TABLE IF NOT EXISTS template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Snapshot of template metadata
  template_data JSONB NOT NULL,
  
  -- Change metadata
  change_type TEXT NOT NULL,
  change_description TEXT,
  
  -- Statistics for quick reference
  slide_count INTEGER NOT NULL,
  layer_count INTEGER NOT NULL,
  
  UNIQUE(template_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_created_at ON template_versions(created_at DESC);

-- Create template_version_slides table
CREATE TABLE IF NOT EXISTS template_version_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES template_versions(id) ON DELETE CASCADE,
  slide_id UUID,
  slide_data JSONB NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_version_slides_version_id ON template_version_slides(version_id);

-- Create template_version_layers table
CREATE TABLE IF NOT EXISTS template_version_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_slide_id UUID NOT NULL REFERENCES template_version_slides(id) ON DELETE CASCADE,
  layer_id UUID,
  layer_data JSONB NOT NULL,
  z_index INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_version_layers_version_slide_id ON template_version_layers(version_slide_id);

-- RLS policies for version tables
ALTER TABLE template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_version_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_version_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marcomms can view all template versions" ON template_versions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'marcomms'::app_role));

CREATE POLICY "System can insert template versions" ON template_versions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Marcomms can view version slides" ON template_version_slides
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM template_versions tv
    WHERE tv.id = template_version_slides.version_id
    AND has_role(auth.uid(), 'marcomms'::app_role)
  ));

CREATE POLICY "System can insert version slides" ON template_version_slides
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Marcomms can view version layers" ON template_version_layers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM template_version_slides tvs
    JOIN template_versions tv ON tv.id = tvs.version_id
    WHERE tvs.id = template_version_layers.version_slide_id
    AND has_role(auth.uid(), 'marcomms'::app_role)
  ));

CREATE POLICY "System can insert version layers" ON template_version_layers
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- PART 2: Version Creation Function
-- ============================================================================

CREATE OR REPLACE FUNCTION create_template_version(
  p_template_id UUID,
  p_change_type TEXT,
  p_change_description TEXT DEFAULT NULL,
  p_version_label TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_version_number INTEGER;
  v_version_id UUID;
  v_slide_count INTEGER;
  v_layer_count INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_version_number
  FROM template_versions
  WHERE template_id = p_template_id;
  
  -- Count slides and layers
  SELECT COUNT(*) INTO v_slide_count
  FROM slides WHERE template_id = p_template_id AND deleted_at IS NULL;
  
  SELECT COUNT(*) INTO v_layer_count
  FROM layers l
  JOIN slides s ON s.id = l.slide_id
  WHERE s.template_id = p_template_id AND s.deleted_at IS NULL;
  
  -- Create version record
  INSERT INTO template_versions (
    template_id, version_number, version_label, created_by,
    template_data, change_type, change_description,
    slide_count, layer_count
  )
  SELECT 
    id,
    v_version_number,
    p_version_label,
    COALESCE(auth.uid(), created_by),
    jsonb_build_object(
      'name', name,
      'brand', brand,
      'category', category,
      'is_published', is_published,
      'psd_file_url', psd_file_url
    ),
    p_change_type,
    p_change_description,
    v_slide_count,
    v_layer_count
  FROM templates
  WHERE id = p_template_id
  RETURNING id INTO v_version_id;
  
  -- Snapshot slides
  INSERT INTO template_version_slides (version_id, slide_id, slide_data, order_index)
  SELECT 
    v_version_id,
    s.id,
    jsonb_build_object(
      'name', s.name,
      'width', s.width,
      'height', s.height
    ),
    s.order_index
  FROM slides s
  WHERE s.template_id = p_template_id AND s.deleted_at IS NULL
  ORDER BY s.order_index;
  
  -- Snapshot layers
  INSERT INTO template_version_layers (version_slide_id, layer_id, layer_data, z_index)
  SELECT 
    tvs.id,
    l.id,
    to_jsonb(l.*),
    l.z_index
  FROM layers l
  JOIN slides s ON s.id = l.slide_id
  JOIN template_version_slides tvs ON tvs.slide_id = s.id
  WHERE s.template_id = p_template_id 
    AND s.deleted_at IS NULL
    AND tvs.version_id = v_version_id;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- PART 3: Backup Storage Bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('template-backups', 'template-backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Marcomms can access backups" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'template-backups' AND
    has_role(auth.uid(), 'marcomms'::app_role)
  )
  WITH CHECK (
    bucket_id = 'template-backups' AND
    has_role(auth.uid(), 'marcomms'::app_role)
  );

-- ============================================================================
-- PART 4: Update Templates RLS to Allow Viewing Archived
-- ============================================================================

-- Drop the existing policy that filters deleted_at
DROP POLICY IF EXISTS "Marcomms can manage all templates" ON templates;

-- Recreate without deleted_at filter so marcomms can see archived templates
CREATE POLICY "Marcomms can manage all templates" ON templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'marcomms'::app_role))
  WITH CHECK (has_role(auth.uid(), 'marcomms'::app_role));

-- ============================================================================
-- PART 5: Enable pg_cron and Schedule Daily Backups
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily backup at 2 AM UTC
SELECT cron.schedule(
  'daily-template-backup',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ubnadwskxlrskoaqsprr.supabase.co/functions/v1/backup-templates',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);