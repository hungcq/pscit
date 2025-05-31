-- Start transaction
BEGIN;

-- Create temporary tables to store the mappings
CREATE TEMPORARY TABLE author_mapping (
    old_id UUID,
    new_id UUID
);

CREATE TEMPORARY TABLE category_mapping (
    old_id UUID,
    new_id UUID
);

-- For Authors:
-- 1. Find duplicates and map them to the first occurrence
WITH duplicate_authors AS (
    SELECT 
        id,
        name,
        FIRST_VALUE(id) OVER (PARTITION BY name ORDER BY created_at) as first_id,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
    FROM authors
)
INSERT INTO author_mapping (old_id, new_id)
SELECT 
    id as old_id,
    first_id as new_id
FROM duplicate_authors
WHERE rn > 1;

-- 2. Update book_authors junction table
UPDATE book_authors ba
SET author_id = am.new_id
FROM author_mapping am
WHERE ba.author_id = am.old_id;

-- 3. Delete duplicate authors
DELETE FROM authors a
WHERE EXISTS (
    SELECT 1 FROM author_mapping am
    WHERE a.id = am.old_id
);

-- For Categories:
-- 1. Find duplicates and map them to the first occurrence
WITH duplicate_categories AS (
    SELECT 
        id,
        name,
        FIRST_VALUE(id) OVER (PARTITION BY name ORDER BY created_at) as first_id,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
    FROM categories
)
INSERT INTO category_mapping (old_id, new_id)
SELECT 
    id as old_id,
    first_id as new_id
FROM duplicate_categories
WHERE rn > 1;

-- 2. Update book_categories junction table
UPDATE book_categories bc
SET category_id = cm.new_id
FROM category_mapping cm
WHERE bc.category_id = cm.old_id;

-- 3. Delete duplicate categories
DELETE FROM categories c
WHERE EXISTS (
    SELECT 1 FROM category_mapping cm
    WHERE c.id = cm.old_id
);

-- Drop temporary tables
DROP TABLE author_mapping;
DROP TABLE category_mapping;

-- Commit transaction
COMMIT; 