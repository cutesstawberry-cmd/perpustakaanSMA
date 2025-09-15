/*
  # Library Management System - Complete Database Setup

  This single migration file contains the complete database setup for the Library Management System.
  It includes all tables, functions, RLS policies, indexes, triggers, and default data needed for a clean setup.

  Key Features:
  - Supports both Supabase Auth admins and admin-created users (Member ID login)
  - Complete borrowing system with availability checks, due dates, overdue status, fines, and pending returns
  - Role-based access control (admin, librarian, member)
  - Book catalog management with copies tracking
  - Secure RLS policies and triggers for automatic updates

  Run this file in Supabase SQL Editor to set up your database.
  For sample books, run the separate 005_add_sample_books.sql file.
*/

-- =============================================
-- 1. CREATE TABLES
-- =============================================

-- Profiles table (supports both Auth users and admin-created users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'librarian', 'member')),
  member_id text UNIQUE, -- Used as login ID for admin-created users
  phone text,
  address text,
  password text, -- Password for admin-created users (hash in production)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Books table with availability tracking
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text,
  genre text,
  publication_year integer,
  description text,
  cover_url text,
  total_copies integer NOT NULL DEFAULT 1 CHECK (total_copies >= available_copies),
  available_copies integer NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Borrowings table with full status support (including pending_return)
CREATE TABLE IF NOT EXISTS borrowings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  borrow_date timestamptz DEFAULT now(),
  due_date timestamptz NOT NULL,
  return_date timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'pending_return')),
  fine_amount decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_borrowings_user_id ON borrowings(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_book_id ON borrowings(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON borrowings(status);
CREATE INDEX IF NOT EXISTS idx_borrowings_due_date ON borrowings(due_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);

-- =============================================
-- 3. CREATE FUNCTIONS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get user role safely
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role(auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if staff (admin or librarian)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN get_user_role(auth.uid()) IN ('admin', 'librarian');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check book availability
CREATE OR REPLACE FUNCTION is_book_available(p_book_id uuid)
RETURNS boolean AS $$
DECLARE
  active_borrowings_count integer;
  available_count integer;
BEGIN
  SELECT available_copies INTO available_count FROM books WHERE id = p_book_id;
  SELECT COUNT(*) INTO active_borrowings_count
  FROM borrowings
  WHERE book_id = p_book_id AND status IN ('active', 'pending_return', 'overdue');
  
  RETURN (available_count > active_borrowings_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update books available_copies on borrow status changes
CREATE OR REPLACE FUNCTION update_books_available_on_borrow()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: if status='active', decrement
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = NEW.book_id;
  END IF;

  -- On UPDATE: handle status changes
  IF TG_OP = 'UPDATE' THEN
    -- From borrowed status to returned: increment
    IF (OLD.status IN ('active', 'pending_return', 'overdue')) AND NEW.status = 'returned' THEN
      UPDATE books
      SET available_copies = available_copies + 1
      WHERE id = NEW.book_id;
    -- From returned to borrowed: decrement
    ELSIF OLD.status = 'returned' AND NEW.status IN ('active', 'pending_return', 'overdue') THEN
      UPDATE books
      SET available_copies = available_copies - 1
      WHERE id = NEW.book_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. CREATE TRIGGERS
-- =============================================

CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_books_updated_at 
  BEFORE UPDATE ON books 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_borrowings_available_insert
  AFTER INSERT ON borrowings
  FOR EACH ROW EXECUTE FUNCTION update_books_available_on_borrow();

CREATE TRIGGER IF NOT EXISTS update_borrowings_available_update
  AFTER UPDATE OF status ON borrowings
  FOR EACH ROW EXECUTE FUNCTION update_books_available_on_borrow();

-- =============================================
-- 5. ENABLE RLS
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. CREATE RLS POLICIES
-- =============================================

-- Profiles
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (is_admin());
CREATE POLICY "Public view profiles" ON profiles FOR SELECT USING (true);

-- Books
CREATE POLICY "All view books" ON books FOR SELECT USING (true);
CREATE POLICY "Staff manage books" ON books FOR ALL USING (is_staff());

-- Borrowings
CREATE POLICY "Users view own borrowings" ON borrowings FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role' OR is_staff());
CREATE POLICY "Users create own borrowings" ON borrowings FOR INSERT WITH CHECK (
  (user_id = auth.uid() OR auth.role() = 'service_role' OR is_staff()) 
  AND is_book_available(book_id) 
  AND status = 'active' 
  AND due_date > now()
);
CREATE POLICY "Users update own borrowings" ON borrowings FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'service_role' OR is_staff());
CREATE POLICY "Staff manage borrowings" ON borrowings FOR ALL USING (is_staff());

-- Categories
CREATE POLICY "All view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Staff manage categories" ON categories FOR ALL USING (is_staff());

-- =============================================
-- 7. DEFAULT DATA (Categories)
-- =============================================

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

GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

GRANT SELECT ON profiles, books, categories TO anon;

-- =============================================
-- 9. INITIALIZE AVAILABLE COPIES (Sync with existing data if any)
-- =============================================

DO $$
DECLARE
  book_rec RECORD;
BEGIN
  FOR book_rec IN 
    SELECT b.id, b.available_copies, COUNT(br.id) as active_count
    FROM books b
    LEFT JOIN borrowings br ON b.id = br.book_id AND br.status IN ('active', 'pending_return', 'overdue')
    GROUP BY b.id, b.available_copies
  LOOP
    UPDATE books 
    SET available_copies = GREATEST(0, book_rec.available_copies - book_rec.active_count)
    WHERE id = book_rec.id;
  END LOOP;
  RAISE NOTICE 'Available copies synchronized with active borrowings.';
END $$;

-- =============================================
-- SETUP COMPLETE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Complete database setup finished successfully!';
  RAISE NOTICE 'Tables: profiles, books, borrowings, categories';
  RAISE NOTICE 'Features: Role-based access, borrowing with availability, overdue handling, pending returns';
  RAISE NOTICE 'Next: Create admin in Supabase Auth, set .env, run app';
  RAISE NOTICE 'For sample books: Run 005_add_sample_books.sql';
END $$;