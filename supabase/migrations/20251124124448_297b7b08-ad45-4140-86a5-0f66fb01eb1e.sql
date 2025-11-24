-- Fix CASCADE DELETE constraints for proper data cleanup
ALTER TABLE slides 
  DROP CONSTRAINT IF EXISTS slides_template_id_fkey,
  ADD CONSTRAINT slides_template_id_fkey 
    FOREIGN KEY (template_id) 
    REFERENCES templates(id) 
    ON DELETE CASCADE;

ALTER TABLE layers 
  DROP CONSTRAINT IF EXISTS layers_slide_id_fkey,
  ADD CONSTRAINT layers_slide_id_fkey 
    FOREIGN KEY (slide_id) 
    REFERENCES slides(id) 
    ON DELETE CASCADE;

ALTER TABLE psd_uploads 
  DROP CONSTRAINT IF EXISTS psd_uploads_template_id_fkey,
  ADD CONSTRAINT psd_uploads_template_id_fkey 
    FOREIGN KEY (template_id) 
    REFERENCES templates(id) 
    ON DELETE CASCADE;

-- Add soft delete support to templates
ALTER TABLE templates 
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Create index for faster queries filtering out deleted templates
CREATE INDEX IF NOT EXISTS idx_templates_deleted_at ON templates(deleted_at) WHERE deleted_at IS NULL;

-- Add soft delete support to template_instances as well
ALTER TABLE template_instances 
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_template_instances_deleted_at ON template_instances(deleted_at) WHERE deleted_at IS NULL;