-- Add reviewed status tracking to form submissions
-- Allows superintendents to mark submissions as reviewed

ALTER TABLE form_submissions
ADD COLUMN reviewed BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN reviewed_at TIMESTAMP,
ADD COLUMN reviewed_by TEXT;

-- Create index for efficient querying by reviewed status
CREATE INDEX idx_form_submissions_reviewed
ON form_submissions(reviewed, submitted_at);

-- Add comments for documentation
COMMENT ON COLUMN form_submissions.reviewed IS 'Whether this submission has been reviewed by the superintendent';
COMMENT ON COLUMN form_submissions.reviewed_at IS 'Timestamp when the submission was marked as reviewed';
COMMENT ON COLUMN form_submissions.reviewed_by IS 'Email of the superintendent who reviewed this submission';
