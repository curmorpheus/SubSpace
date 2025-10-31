-- Create form_types table
CREATE TABLE IF NOT EXISTS form_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id SERIAL PRIMARY KEY,
  form_type_id INTEGER REFERENCES form_types(id) NOT NULL,
  job_number TEXT,
  submitted_by TEXT,
  submitted_by_email TEXT,
  submitted_by_company TEXT,
  data JSONB NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create superintendents table
CREATE TABLE IF NOT EXISTS superintendents (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
