-- Add superintendent tracking to form submissions
-- This allows filtering submissions by the superintendent who should receive them

ALTER TABLE form_submissions
ADD COLUMN superintendent_email TEXT,
ADD COLUMN project_email TEXT;

-- Create index for efficient querying by superintendent email
CREATE INDEX idx_form_submissions_superintendent
ON form_submissions(superintendent_email);

-- Add comments for documentation
COMMENT ON COLUMN form_submissions.superintendent_email IS 'Email of the superintendent who should receive this form submission';
COMMENT ON COLUMN form_submissions.project_email IS 'Project-specific email that receives BCC copies';
