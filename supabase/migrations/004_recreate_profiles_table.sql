-- Recreate profiles table with correct structure for admin-created users
-- WARNING: This will delete all existing data in the profiles table!

-- Backup existing data (optional - uncomment if you want to preserve data)
-- CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Drop existing profiles table and recreate with correct structure
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate profiles table with proper structure
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'librarian', 'member')),
  member_id text UNIQUE, -- Used as login ID for admin-created users
  phone text,
  address text,
  password text, -- Password for admin-created users (in production, use proper hashing)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments
COMMENT ON TABLE profiles IS 'User profiles table - supports both Supabase Auth users and admin-created users';
COMMENT ON COLUMN profiles.member_id IS 'Used as login ID for admin-created users';
COMMENT ON COLUMN profiles.password IS 'Password for admin-created users (in production, use proper hashing)';

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);

-- Recreate triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Recreate RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" 
  ON profiles 
  FOR ALL 
  USING (is_admin());

CREATE POLICY "Public can view profiles" 
  ON profiles FOR SELECT 
  USING (true);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Profiles table recreated successfully!';
  RAISE NOTICE 'The table now supports both Supabase Auth users and admin-created users.';
  RAISE NOTICE 'You can now create users through the admin interface.';
  RAISE NOTICE 'WARNING: All existing profile data has been deleted!';
END $$;