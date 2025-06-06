-- Add back available column
ALTER TABLE book_copies
ADD COLUMN available BOOLEAN DEFAULT true;

-- Update available based on status
UPDATE book_copies
SET available = (status = 'available');

-- Create index on available column
CREATE INDEX idx_book_copies_available ON book_copies(available);

-- Drop the status column and its index
DROP INDEX IF EXISTS idx_book_copies_status;
ALTER TABLE book_copies DROP COLUMN status; 