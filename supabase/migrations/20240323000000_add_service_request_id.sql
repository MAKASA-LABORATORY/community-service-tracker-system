-- Add service_request_id column to service_assignments table
ALTER TABLE service_assignments
ADD COLUMN IF NOT EXISTS service_request_id UUID REFERENCES service_requests(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_assignments_service_request_id ON service_assignments(service_request_id); 