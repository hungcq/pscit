-- Add status column
ALTER TABLE book_copies
ADD COLUMN status VARCHAR(20) DEFAULT 'available';

-- Update status based on available field
UPDATE book_copies
SET status = CASE
    WHEN available = true THEN 'available'
    ELSE 'borrowed'
END;

-- Create index on status column
CREATE INDEX idx_book_copies_status ON book_copies(status);

-- Drop the old available column and its index
DROP INDEX IF EXISTS idx_book_copies_available;
ALTER TABLE book_copies DROP COLUMN available;

-- Add comment to status column
COMMENT ON COLUMN book_copies.status IS 'Status of the book copy: available, borrowed, or reserved'; 