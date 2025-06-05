-- Rename pickup_slot to pickup_time
ALTER TABLE reservations RENAME COLUMN pickup_slot TO pickup_time;

-- Add return_time column
ALTER TABLE reservations
ADD COLUMN return_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN suggested_return_timeslots TEXT[] DEFAULT '{}';

-- Create index on return_time
CREATE INDEX idx_reservations_return ON reservations(return_time);

-- Add comments
COMMENT ON COLUMN reservations.pickup_time IS 'The time when the book is picked up';
COMMENT ON COLUMN reservations.return_time IS 'The time when the book is returned';
COMMENT ON COLUMN reservations.suggested_return_timeslots IS 'Array of suggested return times in RFC3339 format'; 