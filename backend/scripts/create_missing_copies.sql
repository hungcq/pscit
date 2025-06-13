-- Create a like new copy for books that don't have any copies
INSERT INTO book_copies (id, book_id, condition, status, created_at, updated_at)
SELECT 
    gen_random_uuid(), -- Generate a new UUID for each copy
    b.id as book_id,   -- Book ID
    'like_new' as condition, -- Set condition to like_new
    'available' as status,   -- Set status to available
    NOW() as created_at,     -- Set creation timestamp
    NOW() as updated_at      -- Set update timestamp
FROM books b
LEFT JOIN book_copies bc ON b.id = bc.book_id
WHERE bc.id IS NULL;  -- Only for books that don't have any copies

-- Output the number of copies created
SELECT COUNT(*) as copies_created
FROM books b
LEFT JOIN book_copies bc ON b.id = bc.book_id
WHERE bc.id IS NULL; 