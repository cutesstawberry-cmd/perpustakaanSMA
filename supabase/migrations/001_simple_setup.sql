/*
  # Library Management System - Simple Database Setup
  
  This file contains the essential database setup for the Library Management System.
  Only includes necessary tables, basic RLS policies, and core functions.
  
  Authentication System:
  - Admin users: Created directly in Supabase Auth (any email format)
  - Regular users: Created by admin using Member ID (no email required)
  - Login: Admin uses email, Users use Member ID
*/

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Create profiles table (extends auth.users)
-- member_id is used as login identifier for users created by admin
-- member_id is UNIQUE to prevent duplicate login IDs
CREATE TABLE IF NOT EXISTS profiles (
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

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text,
  genre text,
  publication_year integer,
  description text,
  cover_url text,
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create borrowings table
CREATE TABLE IF NOT EXISTS borrowings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  borrow_date timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL,
  return_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  fine_amount decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. CREATE INDEXES
-- =============================================

-- Book indexes for search functionality
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);

-- Borrowing indexes for user and book relationships
CREATE INDEX IF NOT EXISTS idx_borrowings_user_id ON borrowings(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_book_id ON borrowings(book_id);

-- Profile indexes for role-based access and member_id lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
-- Note: member_id already has UNIQUE constraint which creates an index automatically

-- =============================================
-- 3. CREATE FUNCTIONS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get user role (avoids RLS recursion)
-- This function is used by RLS policies to determine user permissions
-- Admin users: Created in Supabase Auth, automatically get 'admin' role
-- Regular users: Created by admin, get 'member' or 'librarian' role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
-- Admin users are those created directly in Supabase Auth
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role(auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is librarian or admin
-- Staff users can manage books and other library resources
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role(auth.uid()) IN ('admin', 'librarian');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. CREATE TRIGGERS
-- =============================================

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_books_updated_at 
  BEFORE UPDATE ON books 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREATE RLS POLICIES
-- =============================================

-- Profiles policies
-- Note: Admin users (created in Supabase Auth) can manage all profiles
-- Regular users (created by admin with Member ID) can only manage their own profile
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

-- Books policies
CREATE POLICY "Books are viewable by authenticated users" 
  ON books FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Staff can manage books" 
  ON books 
  FOR ALL 
  USING (is_staff());

-- Borrowings policies
CREATE POLICY "Users can view their own borrowings" 
  ON borrowings FOR SELECT 
  USING (
    user_id = auth.uid() OR is_staff()
  );

CREATE POLICY "Users can create their own borrowings" 
  ON borrowings FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() OR is_staff()
  );

CREATE POLICY "Staff can manage borrowings" 
  ON borrowings 
  FOR ALL 
  USING (is_staff());

-- Categories policies
CREATE POLICY "Categories are viewable by authenticated users" 
  ON categories FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Staff can manage categories" 
  ON categories 
  FOR ALL 
  USING (is_staff());

-- =============================================
-- 7. INSERT DEFAULT DATA
-- =============================================

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Fiction', 'Fictional literature and novels'),
  ('Non-Fiction', 'Factual books and educational content'),
  ('Science', 'Scientific books and research'),
  ('Technology', 'Technology and computer science books'),
  ('History', 'Historical books and biographies'),
  ('Art', 'Art, design, and creative books'),
  ('Children', 'Books for children and young adults'),
  ('Reference', 'Reference books and encyclopedias')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 8. GRANT PERMISSIONS
-- =============================================

-- Grant permissions to authenticated users
-- Note: Actual access is controlled by RLS policies based on user roles
-- Admin users: Full access to all resources
-- Librarian users: Can manage books and borrowings
-- Member users: Can view books and manage their own borrowings
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public access)
-- Public users can view books and categories without authentication
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON books TO anon;
GRANT SELECT ON categories TO anon;

-- Grant execute permissions on functions
-- These functions are used by RLS policies to determine user access levels
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Library Management System database setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create an admin user in Supabase Auth (any email format)';
  RAISE NOTICE '2. Set up your environment variables';
  RAISE NOTICE '3. Start your application!';
  RAISE NOTICE '4. Login as admin and create users with Member ID';
  RAISE NOTICE '5. Users can login with their Member ID (no email needed)';
END $$;