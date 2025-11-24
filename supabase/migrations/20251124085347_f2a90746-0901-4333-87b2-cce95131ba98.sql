-- Add new AI content types to support semantic extraction
-- These new types enable dynamic multi-layer content generation

-- Add job_description_parsed column to store structured extraction results
ALTER TABLE template_instances 
ADD COLUMN IF NOT EXISTS job_description_parsed JSONB;

-- Add template metadata for frame classification
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS frame_count INTEGER,
ADD COLUMN IF NOT EXISTS template_type TEXT CHECK (template_type IN ('1-frame', '3-frame', '5-7-frame'));

-- Update ai_content_type to support new semantic categories
-- Note: We'll handle this as a TEXT field to support the new values
-- The existing column should already be TEXT, but we'll ensure it supports all new values

COMMENT ON COLUMN layers.ai_content_type IS 'Semantic content type for AI generation. Supported values: headline, subheadline, description, body_text, cta, location, intro, skills, domain_expertise, qualifications_education, qualifications_experience, qualifications_combined, requirements, responsibilities, job_type, email_subject, other';

COMMENT ON COLUMN template_instances.job_description_parsed IS 'Structured JSON containing parsed and extracted content from job description, organized by semantic categories';

COMMENT ON COLUMN templates.frame_count IS 'Number of frames/slides in the template';
COMMENT ON COLUMN templates.template_type IS 'Template classification based on frame count: 1-frame, 3-frame, or 5-7-frame';