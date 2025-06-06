-- Drop the index first
DROP INDEX IF EXISTS idx_reservations_suggested_timeslots;
 
-- Remove the column
ALTER TABLE reservations
DROP COLUMN IF EXISTS suggested_timeslots; 