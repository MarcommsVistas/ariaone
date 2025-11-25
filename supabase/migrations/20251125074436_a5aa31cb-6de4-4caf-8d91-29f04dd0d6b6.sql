-- Add generation_progress field to template_instances
ALTER TABLE template_instances 
ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT NULL;

-- Enable realtime for template_instances table
ALTER TABLE template_instances REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE template_instances;