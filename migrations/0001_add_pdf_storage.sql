-- Add PDF storage column to form_submissions table (base64 encoded)
ALTER TABLE form_submissions ADD COLUMN pdf_data TEXT;
