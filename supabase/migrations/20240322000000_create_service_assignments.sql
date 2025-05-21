-- Create service_assignments table
CREATE TABLE IF NOT EXISTS service_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id),
    service_request_id UUID NOT NULL REFERENCES service_requests(id),
    service_type TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    hours INTEGER NOT NULL,
    location TEXT NOT NULL,
    supervisor TEXT NOT NULL,
    supervisor_email TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_service_assignments_student_id ON service_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_service_request_id ON service_assignments(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_status ON service_assignments(status);
CREATE INDEX IF NOT EXISTS idx_service_assignments_verification_status ON service_assignments(verification_status);

-- Add RLS policies
ALTER TABLE service_assignments ENABLE ROW LEVEL SECURITY;

-- Allow public access for all operations
CREATE POLICY "Enable read access for all users"
    ON service_assignments FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON service_assignments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users"
    ON service_assignments FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
    ON service_assignments FOR DELETE
    USING (true);

-- Grant necessary permissions
GRANT ALL ON service_assignments TO anon;
GRANT ALL ON service_assignments TO authenticated;
GRANT ALL ON service_assignments TO service_role; 