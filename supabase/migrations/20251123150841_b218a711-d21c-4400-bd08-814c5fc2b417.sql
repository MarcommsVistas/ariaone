-- Add V2-specific columns to template_instances
ALTER TABLE template_instances 
ADD COLUMN IF NOT EXISTS job_description JSONB,
ADD COLUMN IF NOT EXISTS caption_copy TEXT,
ADD COLUMN IF NOT EXISTS can_download BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Add AI configuration columns to layers
ALTER TABLE layers
ADD COLUMN IF NOT EXISTS ai_editable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_content_type TEXT,
ADD COLUMN IF NOT EXISTS ai_prompt_template TEXT,
ADD COLUMN IF NOT EXISTS hr_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS hr_editable BOOLEAN DEFAULT false;

-- Add brand voice and AI configuration to brands
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS tov_document_url TEXT,
ADD COLUMN IF NOT EXISTS tov_guidelines TEXT,
ADD COLUMN IF NOT EXISTS ai_instructions JSONB,
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;

-- Create creative_reviews table for V2 workflow
CREATE TABLE IF NOT EXISTS creative_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES template_instances(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested', 'rejected')),
  review_notes TEXT,
  change_requests JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table for real-time alerts
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE creative_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for creative_reviews
CREATE POLICY "HR can view their own submissions"
ON creative_reviews FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) AND submitted_by = auth.uid());

CREATE POLICY "HR can insert their own reviews"
ON creative_reviews FOR INSERT
WITH CHECK (has_role(auth.uid(), 'hr'::app_role) AND submitted_by = auth.uid());

CREATE POLICY "Marcomms can view all reviews"
ON creative_reviews FOR SELECT
USING (has_role(auth.uid(), 'marcomms'::app_role));

CREATE POLICY "Marcomms can update reviews"
ON creative_reviews FOR UPDATE
USING (has_role(auth.uid(), 'marcomms'::app_role))
WITH CHECK (has_role(auth.uid(), 'marcomms'::app_role));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Add trigger for creative_reviews updated_at
CREATE OR REPLACE FUNCTION update_creative_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creative_reviews_updated_at
BEFORE UPDATE ON creative_reviews
FOR EACH ROW
EXECUTE FUNCTION update_creative_reviews_updated_at();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;