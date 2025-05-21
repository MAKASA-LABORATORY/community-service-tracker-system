-- Rename required_hours to total_hours
ALTER TABLE service_requests
RENAME COLUMN required_hours TO total_hours;

-- Add remaining_hours column
ALTER TABLE service_requests
ADD COLUMN remaining_hours INTEGER NOT NULL DEFAULT 0;

-- Update remaining_hours to match total_hours for existing records
UPDATE service_requests
SET remaining_hours = total_hours; 