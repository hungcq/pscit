-- Drop the old book_id column
ALTER TABLE reservations
    DROP COLUMN book_id;

-- Add the new book_copy_id column
ALTER TABLE reservations
    ADD COLUMN book_copy_id UUID NOT NULL REFERENCES book_copies(id); 