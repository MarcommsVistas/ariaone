-- Add performance indexes to speed up RLS policy evaluation and queries
CREATE INDEX IF NOT EXISTS idx_template_instances_created_by ON template_instances(created_by);
CREATE INDEX IF NOT EXISTS idx_slides_instance_id ON slides(instance_id);
CREATE INDEX IF NOT EXISTS idx_template_instances_original_template ON template_instances(original_template_id);

-- Add index for layers slide_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_layers_slide_id ON layers(slide_id);