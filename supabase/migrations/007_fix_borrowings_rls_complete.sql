-- Complete fix for borrowings RLS policies
-- This migration ensures that both authenticated users and service role can access borrowings

-- First, let's check if the policies exist and drop them
DROP POLICY IF EXISTS "Users can view their own borrowings" ON borrowings;
DROP POLICY IF EXISTS "Users can create their own borrowings" ON borrowings;
DROP POLICY IF EXISTS "Staff can manage borrowings" ON borrowings;

-- Create comprehensive policies for borrowings
CREATE POLICY "Users can view their own borrowings" 
  ON borrowings FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    auth.role() = 'service_role' OR 
    is_staff()
  );

CREATE POLICY "Users can create their own borrowings" 
  ON borrowings FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() OR 
    auth.role() = 'service_role' OR 
    is_staff()
  );

CREATE POLICY "Users can update their own borrowings" 
  ON borrowings FOR UPDATE 
  USING (
    user_id = auth.uid() OR 
    auth.role() = 'service_role' OR 
    is_staff()
  );

CREATE POLICY "Staff can manage all borrowings" 
  ON borrowings 
  FOR ALL 
  USING (is_staff());

-- Grant necessary permissions
GRANT ALL ON borrowings TO service_role;
GRANT ALL ON borrowings TO authenticated;

-- Also ensure books table has proper permissions
GRANT ALL ON books TO service_role;
GRANT ALL ON books TO authenticated;