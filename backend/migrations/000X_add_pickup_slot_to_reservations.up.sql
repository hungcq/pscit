-- Add pickup_slot column to reservations table
ALTER TABLE reservations
ADD COLUMN pickup_slot TIMESTAMP WITH TIME ZONE;

-- Create index for pickup_slot
CREATE INDEX idx_reservations_pickup_slot ON reservations(pickup_slot);

-- Update existing reservations to have a default pickup slot (start_date + 1 hour)
UPDATE reservations
SET pickup_slot = start_date + INTERVAL '1 hour'
WHERE pickup_slot IS NULL; 