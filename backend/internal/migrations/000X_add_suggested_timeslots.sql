-- Add suggested_timeslots column to reservations table
ALTER TABLE reservations
ADD COLUMN suggested_timeslots TEXT[] DEFAULT '{}';

-- Add index for faster queries
CREATE INDEX idx_reservations_suggested_timeslots ON reservations USING GIN (suggested_timeslots);

-- Add comment to explain the column
COMMENT ON COLUMN reservations.suggested_timeslots IS 'Array of suggested pickup times in ISO format'; 