# Database Setup Guide

## Simplified Setup (Single File Approach)

To avoid migration conflicts, multiple files, and issues during DB resets, use the single comprehensive migration file. This consolidates all previous migrations (001-009) into one clean setup.

### Steps for New/Reset Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project (or reset existing one via Dashboard > Settings > Database > Reset)
   - Wait for the project to be ready

2. **Run Complete Database Setup**
   - Go to Supabase Dashboard > SQL Editor
   - Copy and paste the entire content of `supabase/migrations/001_complete_setup.sql`
   - Click "Run" to execute
   - This creates all tables (profiles, books, borrowings, categories), functions, RLS policies, triggers, indexes, and default categories
   - Handles borrowing availability, overdue status, pending returns, fines, and role-based access

3. **Add Sample Books (Optional for Testing)**
   - In SQL Editor, copy and paste `supabase/migrations/005_add_sample_books.sql`
   - Run it to add 16 sample books for testing the catalog and borrowing

4. **Create Admin User**
   - Go to Authentication > Users
   - Click "Add user" and create an admin with any email (e.g., `admin@sma.sch.id`) and password
   - **Auto Role**: Supabase Auth users get `role = 'admin'` automatically
   - No need for manual profile insertion

5. **Set Environment Variables**
   - In project root, create/update `.env`:
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   - Get keys from Supabase Dashboard > Settings > API

6. **Test the Setup**
   - Run `npm run dev` (or `yarn dev`)
   - Login as admin with the email/password
   - Verify admin dashboard, create a user (Member ID + password), test borrowing

### Authentication Flow

- **Admin**: Email + password (Supabase Auth) → Full access
- **Users**: Member ID + password (profiles table) → Limited access based on role (member/librarian)
- Roles: admin (full), librarian (manage books/borrowings), member (own borrowings)

### For DB Reset
- In Supabase Dashboard > Settings > Database > Reset (this drops all data)
- Rerun 001_complete_setup.sql (takes ~1 minute)
- Recreate admin user in Auth
- No migration conflicts since single file

### Old Migrations (Archived)
- Files 002-009 are redundant now; ignore or delete them
- They were incremental fixes; 001_complete_setup.sql includes all final logic (e.g., 'pending_return' status, availability checks)
- If you have existing DB with old migrations, run the new 001 file after reset

### Features Included
- **Tables**: profiles (roles/Member ID), books (copies tracking), borrowings (due dates/overdue/fines/pending returns), categories
- **Borrowing**: Auto-availability, triggers for copies update, RLS with checks
- **Security**: Role-based RLS, secure functions
- **Overdue**: Status update, fine calc ($0.50/day), UI alerts
- **Default**: 8 categories; add samples separately

### Troubleshooting
- **Constraint Errors**: Ensure DB reset before running 001
- **RLS Issues**: Policies use SECURITY DEFINER; test with admin login
- **Admin Role**: Verify in profiles table after login
- **Borrow Errors**: Availability enforced; test with sample books
- **Logs**: Check Supabase logs for SQL errors

For support, refer to comments in 001_complete_setup.sql or check console errors.