
-- Criar enums para os novos tipos
CREATE TYPE account_kind AS ENUM ('asset', 'liability');
CREATE TYPE account_subtype AS ENUM (
  'cash', 'bank', 'investment', 'property_rights', 'other_assets',
  'credit_card', 'loan', 'other_liabilities'
);

-- Adicionar novas colunas à tabela accounts
ALTER TABLE accounts 
ADD COLUMN kind account_kind,
ADD COLUMN subtype account_subtype;

-- Migrar dados existentes
-- Contas 'on_budget' -> 'asset' com subtype 'bank'
UPDATE accounts 
SET kind = 'asset', subtype = 'bank' 
WHERE type = 'on_budget';

-- Contas 'credit' -> 'liability' com subtype 'credit_card'
UPDATE accounts 
SET kind = 'liability', subtype = 'credit_card' 
WHERE type = 'credit';

-- Tornar as novas colunas obrigatórias após a migração
ALTER TABLE accounts 
ALTER COLUMN kind SET NOT NULL,
ALTER COLUMN subtype SET NOT NULL;

-- Criar índices para melhor performance
CREATE INDEX idx_accounts_kind ON accounts(kind);
CREATE INDEX idx_accounts_subtype ON accounts(subtype);
CREATE INDEX idx_accounts_kind_subtype ON accounts(kind, subtype);

-- Verificar consistência da migração
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count 
    FROM accounts 
    WHERE kind IS NULL OR subtype IS NULL;
    
    IF unmigrated_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % accounts were not migrated', unmigrated_count;
    END IF;
    
    RAISE NOTICE 'Migration completed successfully. All accounts migrated.';
END $$;
