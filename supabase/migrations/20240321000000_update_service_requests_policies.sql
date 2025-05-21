-- Enable RLS on the table
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view service requests" ON service_requests;
DROP POLICY IF EXISTS "Allow authenticated users to insert service requests" ON service_requests;
DROP POLICY IF EXISTS "Allow authenticated users to update service requests" ON service_requests;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON service_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON service_requests;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON service_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON service_requests;
DROP POLICY IF EXISTS "Enable insert for all users" ON service_requests;
DROP POLICY IF EXISTS "Enable update for all users" ON service_requests;
DROP POLICY IF EXISTS "Allow authenticated users to delete rejected service requests" ON service_requests;

-- Create new policies for public access
CREATE POLICY "Enable read access for all users"
    ON service_requests FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON service_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users"
    ON service_requests FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for rejected requests"
    ON service_requests FOR DELETE
    USING (status = 'rejected');

-- Grant necessary permissions to the anon role
GRANT ALL ON service_requests TO anon;
GRANT ALL ON service_requests TO authenticated;
GRANT ALL ON service_requests TO service_role; 