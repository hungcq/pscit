-- Drop return_time column and its index
DROP INDEX IF EXISTS idx_reservations_return;
ALTER TABLE reservations DROP COLUMN return_time;
ALTER TABLE reservations DROP COLUMN suggested_return_timeslots;

-- Rename pickup_time back to pickup_slot
ALTER TABLE reservations RENAME COLUMN pickup_time TO pickup_slot; 