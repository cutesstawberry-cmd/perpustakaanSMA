# Database Setup Guide

## Quick Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Run Database Setup**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the entire content of `supabase/migrations/001_simple_setup.sql`
   - Click "Run" to execute the setup
   - **Important**: If you get "password column not found" error, also run `supabase/migrations/002_add_password_column.sql`

3. **Add Sample Books (Optional)**
   - To test the book catalog functionality, run `supabase/migrations/005_add_sample_books.sql`
   - This will add 16 sample books to your database

4. **Create Admin User**
   - Go to Authentication > Users in your Supabase dashboard
   - Click "Add user" and create an admin user with any email and password
   - **Important**: Any user created directly in Supabase Auth will automatically be an admin
   - Example emails: `admin@library.com`, `manager@school.edu`, `librarian@library.org`
   - The system will automatically assign admin role to Supabase Auth users

5. **Set Environment Variables**
   - Create `.env` file in your project root
   - Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Authentication Flow

### Admin Access (Supabase Auth)
- **Admin users** are created directly in Supabase Authentication dashboard
- **Auto Role Assignment**: Any user created in Supabase Auth gets `role = 'admin'` automatically
- **No Email Restrictions**: Any email format works, no need to contain "admin" keywords

### User Access (Created by Admin)
- **Regular users** are created by admin through the "Manage Users" page
- **Admin creates**: Member ID, password, full name, role (member/librarian)
- **Simple Setup**: User is created directly in profiles table (no Supabase Auth required)
- **Login Method**: Users login with Member ID and password
- **Default Role**: Users created by admin are `member` by default (unless specified otherwise)
- **Password Storage**: Passwords are stored in profiles table (use proper hashing in production)

### Login Process
1. **Admin Login**: User enters email and password → System authenticates with Supabase Auth
2. **User Login**: User enters Member ID and password → System checks credentials in profiles table
3. System fetches profile and sets appropriate role
4. User is redirected based on their role

### Logout
- Both admin and regular users can logout using the dropdown menu in the header
- Logout clears the session and redirects to the login page

## What the Setup File Includes

### Tables Created
- `profiles` - User profiles with roles (admin, librarian, member)
- `books` - Book catalog with availability tracking
- `borrowings` - Book borrowing records with fines
- `reservations` - Book reservation system
- `reviews` - Book reviews and ratings
- `categories` - Book categorization

### Functions Created
- `get_user_role(user_id)` - Get user role safely
- `is_admin()` - Check if current user is admin
- `is_staff()` - Check if current user is admin or librarian
- `create_admin_profile()` - Helper to create admin profiles
- `update_updated_at_column()` - Auto-update timestamps

### Book CRUD Functions
- `create_book()` - Create new book (staff only)
- `update_book()` - Update book details (staff only)
- `delete_book()` - Delete book (staff only, checks for active borrowings)
- `get_book_details()` - Get detailed book information
- `search_books()` - Search books with filters

### User CRUD Functions
- `create_user()` - Create new user (admin only)
- `update_user_profile()` - Update user profile (admin or self)
- `delete_user()` - Delete user (admin only, checks for active borrowings)
- `get_user_details()` - Get user details (admin or self)
- `list_users()` - List users with filters (admin only)

### Security Features
- Row Level Security (RLS) enabled on all tables
- Role-based access control policies
- No infinite recursion in policies
- Proper permissions for authenticated and anonymous users

### Default Data
- 8 default book categories (Fiction, Non-Fiction, Science, etc.)

## Troubleshooting

### If you get permission errors:
- Make sure you're running the SQL as the project owner
- Check that all grants were applied correctly

### If you get RLS errors:
- The setup file includes proper functions to avoid recursion
- All policies use helper functions instead of direct table queries

### If admin user can't access admin features:
- Verify the user has `role = 'admin'` in the profiles table
- Check that the `create_admin_profile()` function was called correctly

## Manual Admin Creation (Alternative)

If the helper function doesn't work, you can manually create an admin profile:

```sql
INSERT INTO profiles (
  id,
  full_name,
  role,
  member_id,
  created_at,
  updated_at
) VALUES (
  'USER_ID_HERE',
  'Admin Name',
  'admin',
  'ADMIN001',
  now(),
  now()
);
```

## Available Pages

### Public Pages
- **Login** - User authentication
- **Books** - Browse and search books (authenticated users)

### Admin Pages
- **Admin Dashboard** - Overview and statistics
- **Admin Books** - Manage book catalog (admin/librarian)
- **Admin Users** - Manage users and create new accounts (admin only)
- **Admin Borrowings** - Manage book borrowings (admin/librarian)

### User Pages
- **Dashboard** - User dashboard
- **My Borrowings** - View personal borrowing history

## Features

- **Complete CRUD Operations** for books and users
- **Role-based access control** (admin, librarian, member)
- **User management** by admins (create, edit, delete users)
- **Book catalog management** with search and filters
- **Secure authentication** with Supabase
- **Responsive design** with dark/light theme support
- **QR code generation** for books
- **Borrowing system** with due dates and fines

## Testing Authentication Scenarios

### Test Admin Access (Supabase Auth)
1. **Create Admin User**:
   - Go to Supabase Dashboard > Authentication > Users
   - Add user with any email (e.g., `manager@library.com` or `john@school.edu`)
   - Set password and confirm email

2. **Login as Admin**:
   - Go to your application login page
   - Use the admin email and password
   - System should automatically assign admin role
   - You should see admin dashboard and admin menu items

### Test User Access (Created by Admin)
1. **Login as Admin First**:
   - Login with admin credentials
   - Go to "Users Management" page

2. **Create Regular User**:
   - Click "Create User" button
   - Fill in: Member ID, password, full name, role (member/librarian)
   - Click "Create User"

3. **Test User Login**:
   - Logout from admin account
   - Login with Member ID and password (e.g., MEM001 and password123)
   - User should see appropriate pages based on their role

### Verification Checklist

1. **Check Tables**: All tables should be created
2. **Check Functions**: All functions should be available
3. **Check Policies**: RLS policies should be active
4. **Test Admin Login**: Admin user should access admin features
5. **Test User Creation**: Admin should be able to create users
6. **Test User Login**: Created users should access user features
7. **Test CRUD**: Try creating, editing, and deleting books/users
8. **Test Role Permissions**: Verify role-based access control works

## Support

If you encounter any issues:
1. Check the Supabase logs in your project dashboard
2. Verify all SQL commands executed successfully
3. Make sure environment variables are set correctly
4. Check browser console for any client-side errors