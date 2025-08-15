
-- Remove budget entries for parent categories that have subcategories
-- This ensures only leaf categories (subcategories or categories without children) have budget values

DELETE FROM budgets 
WHERE category_id IN (
  SELECT DISTINCT parent_id 
  FROM categories 
  WHERE parent_id IS NOT NULL 
  AND parent_id IN (SELECT id FROM categories)
);
