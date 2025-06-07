-- Delete orphaned book_authors records
DELETE FROM book_authors ba
WHERE NOT EXISTS (
    SELECT 1 FROM books b 
    WHERE b.id = ba.book_id
)
OR NOT EXISTS (
    SELECT 1 FROM authors a 
    WHERE a.id = ba.author_id
);

-- Delete orphaned book_categories records
DELETE FROM book_categories bc
WHERE NOT EXISTS (
    SELECT 1 FROM books b 
    WHERE b.id = bc.book_id
)
OR NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE c.id = bc.category_id
);

-- Delete orphaned authors (authors with no books)
DELETE FROM authors a
WHERE NOT EXISTS (
    SELECT 1 FROM book_authors ba 
    WHERE ba.author_id = a.id
);

-- Delete orphaned categories (categories with no books)
DELETE FROM categories c
WHERE NOT EXISTS (
    SELECT 1 FROM book_categories bc 
    WHERE bc.category_id = c.id
);