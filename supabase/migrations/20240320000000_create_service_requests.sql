-- Create service_requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    supervisor_name TEXT NOT NULL,
    supervisor_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    required_hours INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at);

-- Add RLS policies
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all service requests
CREATE POLICY "Allow authenticated users to view service requests"
    ON service_requests FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert service requests
CREATE POLICY "Allow authenticated users to insert service requests"
    ON service_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update service requests
CREATE POLICY "Allow authenticated users to update service requests"
    ON service_requests FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete rejected service requests
CREATE POLICY "Allow authenticated users to delete rejected service requests"
    ON service_requests FOR DELETE
    TO authenticated
    USING (status = 'rejected'); 