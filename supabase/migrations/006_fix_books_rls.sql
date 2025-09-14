-- Fix RLS policy for books table to allow member users to view books
-- The current policy only allows 'authenticated' users, but member users 
-- don't use Supabase Auth, so they need access via service role

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Books are viewable by authenticated users" ON books;

-- Create a new policy that allows all users (including service role for members)
CREATE POLICY "Books are viewable by all users" 
  ON books FOR SELECT 
  USING (true);

-- Also ensure books table is accessible to anon users for public viewing
GRANT SELECT ON books TO anon;

-- Fix RLS policy for borrowings table to allow proper access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own borrowings" ON borrowings;
DROP POLICY IF EXISTS "Users can create their own borrowings" ON borrowings;

-- Create new policies that work with both auth users and service role
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

-- Ensure borrowings table is accessible to service role
GRANT ALL ON borrowings TO service_role;