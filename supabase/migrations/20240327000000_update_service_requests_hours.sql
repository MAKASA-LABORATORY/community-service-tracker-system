-- Add new columns
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS total_hours INTEGER,
ADD COLUMN IF NOT EXISTS remaining_hours INTEGER;

-- Update existing rows to set total_hours and remaining_hours equal to required_hours
UPDATE service_requests 
SET total_hours = required_hours,
    remaining_hours = required_hours
WHERE total_hours IS NULL OR remaining_hours IS NULL;

-- Make the new columns NOT NULL
ALTER TABLE service_requests 
ALTER COLUMN total_hours SET NOT NULL,
ALTER COLUMN remaining_hours SET NOT NULL;

-- Drop the old column
ALTER TABLE service_requests 
DROP COLUMN required_hours; 