
-- Saneamento de dados antes de criar as foreign keys
-- Remove referências órfãs em transactions
UPDATE transactions 
SET category_id = NULL 
WHERE category_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = transactions.category_id);

-- Remove orçamentos órfãos (sem categoria correspondente)
DELETE FROM budgets 
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = budgets.category_id);

-- Remove referências de parent_id órfãs em categories
UPDATE categories 
SET parent_id = NULL 
WHERE parent_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = categories.parent_id);

-- Adicionar foreign key constraints com ON DELETE RESTRICT
-- FK: transactions -> categories (permite NULL, mas impede excluir categoria usada)
ALTER TABLE transactions
ADD CONSTRAINT transactions_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id)
ON DELETE RESTRICT;

-- FK: budgets -> categories (impede excluir categoria usada em orçamento)
ALTER TABLE budgets
ADD CONSTRAINT budgets_category_id_fkey
FOREIGN KEY (category_id) REFERENCES categories(id)
ON DELETE RESTRICT;

-- FK: categories parent_id -> categories id (impede excluir categoria que tem subcategorias)
ALTER TABLE categories
ADD CONSTRAINT categories_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES categories(id)
ON DELETE RESTRICT;
