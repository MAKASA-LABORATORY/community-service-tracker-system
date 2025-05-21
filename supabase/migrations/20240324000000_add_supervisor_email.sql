-- Add supervisor_email column to service_assignments table
ALTER TABLE service_assignments
ADD COLUMN IF NOT EXISTS supervisor_email TEXT NOT NULL DEFAULT '';

-- Update existing rows to have a default value
UPDATE service_assignments
SET supervisor_email = supervisor || '@example.com'
WHERE supervisor_email = ''; 