-- Add 'pending_return' status to borrowings table check constraint
-- This migration updates the status CHECK constraint to include 'pending_return' for return request workflow

-- Drop the existing check constraint
ALTER TABLE borrowings DROP CONSTRAINT IF EXISTS borrowings_status_check;

-- Add the updated check constraint including 'pending_return'
ALTER TABLE borrowings ADD CONSTRAINT borrowings_status_check 
CHECK (status IN ('active', 'returned', 'overdue', 'pending_return'));

-- Update any existing records if needed (though unlikely, for safety)
-- If there are records with invalid status, this would fail, but assuming data is clean

-- Display completion message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Added "pending_return" status to borrowings check constraint.';
  RAISE NOTICE 'This allows the return request workflow to function properly.';
END $$;