
-- Saneamento de dados antes de criar as foreign keys
-- Remove referências órfãs em transactions
UPDATE transactions 
SET account_id = NULL 
WHERE account_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = transactions.account_id);

UPDATE transactions 
SET credit_card_id = NULL 
WHERE credit_card_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM credit_cards cc WHERE cc.id = transactions.credit_card_id);

-- Remove contas órfãs (sem instituição correspondente)
DELETE FROM accounts 
WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = accounts.institution_id);

-- Remove cartões órfãos (sem instituição correspondente)
DELETE FROM credit_cards 
WHERE NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = credit_cards.institution_id);

-- Remove investimentos órfãos (sem instituição correspondente, quando institution_id não é NULL)
UPDATE investments 
SET institution_id = NULL 
WHERE institution_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM institutions i WHERE i.id = investments.institution_id);

-- Adicionar foreign key constraints com ON DELETE RESTRICT

-- FK: accounts -> institutions (impede excluir instituição que tem contas)
ALTER TABLE accounts
ADD CONSTRAINT accounts_institution_id_fkey
FOREIGN KEY (institution_id) REFERENCES institutions(id)
ON DELETE RESTRICT;

-- FK: credit_cards -> institutions (impede excluir instituição que tem cartões)
ALTER TABLE credit_cards
ADD CONSTRAINT credit_cards_institution_id_fkey
FOREIGN KEY (institution_id) REFERENCES institutions(id)
ON DELETE RESTRICT;

-- FK: investments -> institutions (permite NULL, mas impede excluir instituição usada)
ALTER TABLE investments
ADD CONSTRAINT investments_institution_id_fkey
FOREIGN KEY (institution_id) REFERENCES institutions(id)
ON DELETE RESTRICT;

-- FK: transactions -> accounts (permite NULL, mas impede excluir conta usada)
ALTER TABLE transactions
ADD CONSTRAINT transactions_account_id_fkey
FOREIGN KEY (account_id) REFERENCES accounts(id)
ON DELETE RESTRICT;

-- FK: transactions -> credit_cards (permite NULL, mas impede excluir cartão usado)
ALTER TABLE transactions
ADD CONSTRAINT transactions_credit_card_id_fkey
FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id)
ON DELETE RESTRICT;
