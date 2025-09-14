-- Enhance borrowings table for proper book borrowing functionality
-- This migration adds:
-- 1. Function to check book availability
-- 2. Triggers to auto-update books.available_copies on borrow/return
-- 3. Updated RLS policies with availability check on INSERT
-- 4. Ensures staff can override if needed, but enforces for regular users

-- =============================================
-- 1. DROP EXISTING POLICIES (to recreate cleanly)
-- =============================================
DROP POLICY IF EXISTS "Users can view their own borrowings" ON borrowings;
DROP POLICY IF EXISTS "Users can create their own borrowings" ON borrowings;
DROP POLICY IF EXISTS "Users can update their own borrowings" ON borrowings;
DROP POLICY IF EXISTS "Staff can manage all borrowings" ON borrowings;

-- Drop existing triggers and functions if they exist (for safety)
DROP TRIGGER IF EXISTS update_books_available_on_borrow_insert ON borrowings;
DROP TRIGGER IF EXISTS update_books_available_on_borrow_update ON borrowings;
DROP FUNCTION IF EXISTS update_books_available_on_borrow() CASCADE;
DROP FUNCTION IF EXISTS is_book_available(uuid) CASCADE;

-- =============================================
-- 2. CREATE HELPER FUNCTIONS
-- =============================================

-- Function to check if a book is available for borrowing
-- Returns true if books.available_copies > count of active borrowings for that book
CREATE OR REPLACE FUNCTION is_book_available(p_book_id uuid)
  SET search_path = 'public', 'extensions'
RETURNS boolean AS $$
DECLARE
  active_borrowings_count integer;
  available_count integer;
BEGIN
  SELECT available_copies INTO available_count FROM books WHERE id = p_book_id;
  SELECT COUNT(*) INTO active_borrowings_count
  FROM borrowings
  WHERE book_id = p_book_id AND status = 'active';
  
  RETURN (available_count > active_borrowings_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update book's available_copies based on borrowings status
CREATE OR REPLACE FUNCTION update_books_available_on_borrow()
  SET search_path = 'public', 'extensions'
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: if status='active', decrement available_copies
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = NEW.book_id;
  END IF;

  -- On UPDATE: handle status changes
  IF TG_OP = 'UPDATE' THEN
    -- If changing from 'active' or 'pending_return' to 'returned', increment available_copies
    IF (OLD.status = 'active' OR OLD.status = 'pending_return') AND NEW.status = 'returned' THEN
      UPDATE books
      SET available_copies = available_copies + 1
      WHERE id = NEW.book_id;
    -- If changing from 'returned' to 'active', decrement
    ELSIF OLD.status = 'returned' AND NEW.status = 'active' THEN
      UPDATE books
      SET available_copies = available_copies - 1
      WHERE id = NEW.book_id;
    -- For overdue to returned, treat as return (increment)
    ELSIF OLD.status = 'overdue' AND NEW.status = 'returned' THEN
      UPDATE books
      SET available_copies = available_copies + 1
      WHERE id = NEW.book_id;
    -- For other overdue or pending_return changes, no change (still borrowed)
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. CREATE TRIGGERS
-- =============================================

-- Trigger for INSERT on borrowings
CREATE TRIGGER update_books_available_on_borrow_insert
  AFTER INSERT ON borrowings
  FOR EACH ROW 
  EXECUTE FUNCTION update_books_available_on_borrow();

-- Trigger for UPDATE on borrowings
CREATE TRIGGER update_books_available_on_borrow_update
  AFTER UPDATE OF status ON borrowings
  FOR EACH ROW 
  EXECUTE FUNCTION update_books_available_on_borrow();

-- =============================================
-- 4. CREATE RLS POLICIES
-- =============================================

-- Users can view their own borrowings (or staff/service_role)
CREATE POLICY "Users can view their own borrowings" 
  ON borrowings FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    auth.role() = 'service_role' OR 
    is_staff()
  );

-- Users can create their own borrowings, but only if book is available (staff/service_role bypass; anon for members with user_id)
CREATE POLICY "Users can create their own borrowings"
  ON borrowings FOR INSERT
  WITH CHECK (
    (auth.role() = 'service_role' OR is_staff()) OR
    (
      (auth.role() = 'authenticated' AND user_id = auth.uid()) OR
      (auth.role() = 'anon' AND user_id IS NOT NULL)
    ) AND
    is_book_available(book_id) AND     -- Book must be available
    status = 'active' AND              -- Default status
    due_date > now()                   -- Due date in future
  );

-- Users can update their own borrowings (e.g., extend due date)
CREATE POLICY "Users can update their own borrowings" 
  ON borrowings FOR UPDATE 
  USING (
    user_id = auth.uid() OR 
    auth.role() = 'service_role' OR 
    is_staff()
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    auth.role() = 'service_role' OR 
    is_staff()
  );

-- Staff can manage all borrowings (full access, bypasses availability for admin actions)
CREATE POLICY "Staff can manage all borrowings" 
  ON borrowings 
  FOR ALL 
  USING (is_staff())
  WITH CHECK (is_staff());

-- =============================================
-- 5. GRANT PERMISSIONS
-- =============================================
GRANT ALL ON borrowings TO service_role;
GRANT ALL ON borrowings TO authenticated;
GRANT EXECUTE ON FUNCTION is_book_available(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_books_available_on_borrow() TO authenticated, service_role;

-- Ensure books grants are in place
GRANT ALL ON books TO service_role;
GRANT ALL ON books TO authenticated;

-- =============================================
-- 6. INITIALIZATION (optional: reset available_copies based on current borrowings)
-- =============================================
-- Run this once to sync available_copies with current active borrowings
DO $$
DECLARE
  book_rec RECORD;
BEGIN
  FOR book_rec IN 
    SELECT b.id, b.available_copies, COUNT(br.id) as active_count
    FROM books b
    LEFT JOIN borrowings br ON b.id = br.book_id AND br.status = 'active'
    GROUP BY b.id, b.available_copies
  LOOP
    UPDATE books 
    SET available_copies = book_rec.available_copies - book_rec.active_count
    WHERE id = book_rec.id;
  END LOOP;
  RAISE NOTICE 'Available copies synchronized with active borrowings.';
END $$;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Borrowings enhancements completed! Policies now enforce book availability on borrow.';
  RAISE NOTICE 'Triggers auto-update available_copies on borrow/return.';
  RAISE NOTICE 'Run this migration in Supabase SQL Editor to apply.';
END $$;