# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Could not find the 'password' column of 'profiles' in the schema cache"

**Problem**: Database schema doesn't have the password column for user creation.

**Solution A (Safe - Add column only)**:
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file `supabase/migrations/002_add_password_column.sql`

**Solution B (If you get "column id is in a primary key" error)**:
1. Run the migration file `supabase/migrations/003_fix_profiles_table.sql`
2. This will check the table structure and provide guidance

**Solution C (Nuclear option - Recreate table)**:
⚠️ **WARNING: This will delete all existing profile data!**
1. Run the migration file `supabase/migrations/004_recreate_profiles_table.sql`
2. This will recreate the table with the correct structure
3. You'll need to recreate any existing admin users

### 2. "ERROR: 42P16: column 'id' is in a primary key"

**Problem**: Trying to modify a primary key column that has constraints.

**Solution**:
1. **First, try the safe approach**: Run `supabase/migrations/003_fix_profiles_table.sql`
2. **If that doesn't work**: You need to recreate the table
3. **Run the nuclear option**: `supabase/migrations/004_recreate_profiles_table.sql`

**Why this happens**: The original table was created with a foreign key constraint to `auth.users`, which prevents modification of the `id` column.

### 3. Member ID Input Not Auto-Uppercase

**Problem**: Member ID input field doesn't automatically convert to uppercase.

**Solution**: The form has been updated with better uppercase handling:
- Uses both `onChange` and `onInput` events
- Updates form field value automatically
- CSS `text-transform: uppercase` for visual feedback

**If still having issues**:
1. Clear browser cache
2. Refresh the page
3. Try typing in the Member ID field - it should auto-convert to uppercase

### 3. User Creation Still Failing

**Problem**: Cannot create users even after fixing password column.

**Solution**:
1. Check browser console for detailed error messages
2. Verify database permissions
3. Ensure you're logged in as admin
4. Check if Member ID is unique (no duplicates)

### 4. Login Issues

**Problem**: Cannot login with created user credentials.

**Solution**:
- **Admin Login**: Use email and password (created in Supabase Auth)
- **User Login**: Use Member ID and password (created by admin)
- Check if password matches exactly (case-sensitive)

### 5. Database Connection Issues

**Problem**: Cannot connect to Supabase database.

**Solution**:
1. Check environment variables in `.env` file:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Verify Supabase project is active
3. Check network connection

## Quick Fix Commands

### Reset Database Schema
If you need to completely reset the database:

```sql
-- Drop and recreate profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Recreate with password column
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'librarian', 'member')),
  member_id text UNIQUE,
  phone text,
  address text,
  password text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Check Current Schema
To see current table structure:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

## Getting Help

If you're still experiencing issues:

1. Check browser console for error messages
2. Check Supabase logs in the dashboard
3. Verify all environment variables are set correctly
4. Ensure you're using the latest version of the code

## Testing User Creation

To test if user creation is working:

1. Login as admin
2. Go to "Manage Users" page
3. Click "Create User"
4. Fill in:
   - Member ID: `TEST001`
   - Password: `test123`
   - Full Name: `Test User`
   - Role: `member`
5. Click "Create User"

If successful, you should see a success message and the user should appear in the list.

## Testing Book Catalog

To test if the book catalog is working:

1. **Add Sample Books** (if not already done):
   - Run `supabase/migrations/005_add_sample_books.sql` in SQL Editor
   - This adds 16 sample books to test with

2. **Test Book Display**:
   - Login as any user (admin, librarian, or member)
   - Go to "Books" page
   - You should see a grid of book cards
   - Each card should show: title, author, availability, genre

3. **Test Book Functions**:
   - **View Details**: Click the eye icon to see book details
   - **Borrow Book** (members only): Click "Borrow" button if available
   - **Edit Book** (admin/librarian): Click edit icon to modify book
   - **Delete Book** (admin/librarian): Click delete icon to remove book
   - **Add Book** (admin/librarian): Click "Add Book" button

4. **Test Search**:
   - Use the search box to find books by title or author
   - Try searching for "Harry Potter" or "1984"

If books don't appear, check:
- Database has books table with data
- RLS policies allow reading books
- User is properly authenticated
- **For member users**: Ensure they're using the correct client (supabaseMember) for database access

## Book Catalog Not Showing for Members

**Problem**: Books appear for admin users but not for member users.

**Solution**: This has been fixed by implementing role-based Supabase clients:
- **Admin/Librarian users**: Use regular `supabase` client (authenticated via Supabase Auth)
- **Member users**: Use `supabaseMember` client (uses service role key for database access)

**Technical Details**:
- Member users login with `member_id` and don't have valid Supabase Auth sessions
- They need service role access to query the database
- The system automatically selects the appropriate client based on user role