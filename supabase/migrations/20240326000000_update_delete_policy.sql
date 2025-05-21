-- Drop existing delete policy
DROP POLICY IF EXISTS "Enable delete for rejected requests" ON service_requests;

-- Create new policy to allow deletion of rejected and approved requests
CREATE POLICY "Enable delete for rejected and approved requests"
    ON service_requests FOR DELETE
    USING (status IN ('rejected', 'approved')); 