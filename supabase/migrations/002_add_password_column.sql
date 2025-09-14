-- Add password column to profiles table if it doesn't exist
-- This migration ensures the password column is available for admin-created users

-- Add password column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password text;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.password IS 'Password for admin-created users (in production, use proper hashing)';

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Password column added to profiles table successfully!';
  RAISE NOTICE 'Admin-created users can now be stored with passwords.';
  RAISE NOTICE 'Note: If you need to modify the id column, you may need to recreate the table.';
END $$;