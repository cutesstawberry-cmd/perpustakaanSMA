# Library Management System Setup

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Setup

1. Create a new Supabase project
2. Run the complete setup file: `supabase/migrations/001_initial_setup.sql`
   - This single file contains everything: tables, policies, functions, grants, and permissions
3. Go to Authentication > Users in your Supabase dashboard
4. Create an admin user manually with email and password
5. Create admin profile by running this SQL:
   ```sql
   SELECT create_admin_profile(auth.uid(), 'Admin Name', 'ADMIN001');
   ```

## Authentication Flow

### Admin Login
- Admins can log in using their email and password registered in Supabase Auth
- Admin users must have `role = 'admin'` in the profiles table

### User Management
- Admins can create new users through the Admin Users page
- New users are automatically created in both Supabase Auth and the profiles table
- Users can be assigned roles: admin, librarian, or member

### Logout
- Both admin and regular users can logout using the dropdown menu in the header
- Logout clears the session and redirects to the login page

## Troubleshooting

### Login Button Not Responding
If the login button doesn't respond:
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Ensure Supabase project is active and accessible
4. Check if user exists in Supabase Auth

### "Invalid input: expected string, received undefined" Error
This error occurs when form validation fails. The login form now uses Ant Design's Form component with proper validation:
- Email field is required and must be a valid email
- Password field is required and must be at least 6 characters
- Form validation happens before submission

### CSS Parsing Errors
If you see CSS parsing errors:
1. Clear browser cache
2. Restart the development server
3. Check for conflicting CSS rules

### Environment Variables
Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Testing Login
1. Create a test user in Supabase Auth dashboard
2. Set the user's role to 'admin' in the profiles table
3. Try logging in with the test credentials
4. Check browser console for debugging information

### "Infinite recursion detected in policy" Error
This error has been fixed in the new setup file. The `001_initial_setup.sql` includes:
1. `get_user_role()` function to avoid recursion
2. `is_admin()` and `is_staff()` helper functions
3. All policies use these functions instead of direct table queries
4. If you still see the error, make sure you're using the new setup file

## Features

- Role-based access control
- User management by admins
- Secure authentication with Supabase
- Responsive design with dark/light theme support