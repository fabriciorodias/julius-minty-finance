
-- Add sort_index column to categories table
ALTER TABLE categories ADD COLUMN sort_index INTEGER DEFAULT 0;

-- Update existing categories with initial sort_index values based on creation order
UPDATE categories 
SET sort_index = row_number() OVER (PARTITION BY user_id, type, parent_id ORDER BY created_at)
WHERE sort_index = 0;

-- Create index for better performance on sorting queries
CREATE INDEX idx_categories_sort ON categories(user_id, type, parent_id, sort_index);
