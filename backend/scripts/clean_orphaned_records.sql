-- Delete orphaned book_authors records
DELETE FROM book_authors ba
WHERE NOT EXISTS (
    SELECT 1 FROM books b 
    WHERE b.id = ba.book_id 
    AND b.deleted_at IS NULL
)
OR NOT EXISTS (
    SELECT 1 FROM authors a 
    WHERE a.id = ba.author_id 
    AND a.deleted_at IS NULL
);

-- Delete orphaned book_categories records
DELETE FROM book_categories bc
WHERE NOT EXISTS (
    SELECT 1 FROM books b 
    WHERE b.id = bc.book_id 
    AND b.deleted_at IS NULL
)
OR NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.id = bc.category_id 
    AND c.deleted_at IS NULL
);