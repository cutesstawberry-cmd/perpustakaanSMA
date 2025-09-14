-- Fix profiles table structure for admin-created users
-- This migration handles cases where the table already exists with old structure

-- First, check if password column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'password'
    ) THEN
        ALTER TABLE profiles ADD COLUMN password text;
        RAISE NOTICE 'Password column added to profiles table';
    ELSE
        RAISE NOTICE 'Password column already exists in profiles table';
    END IF;
END $$;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.password IS 'Password for admin-created users (in production, use proper hashing)';

-- Check if we need to modify the id column structure
DO $$
BEGIN
    -- Check if id column references auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'profiles' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'id'
    ) THEN
        RAISE NOTICE 'ID column has foreign key constraint to auth.users';
        RAISE NOTICE 'To allow admin-created users, you may need to:';
        RAISE NOTICE '1. Drop the foreign key constraint';
        RAISE NOTICE '2. Modify the id column to allow independent UUIDs';
        RAISE NOTICE '3. Or recreate the table with the new structure';
    ELSE
        RAISE NOTICE 'ID column is independent, no foreign key constraints found';
    END IF;
END $$;

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Profiles table migration completed!';
  RAISE NOTICE 'Password column is now available for user creation.';
  RAISE NOTICE 'If you still get errors, you may need to recreate the table.';
END $$;