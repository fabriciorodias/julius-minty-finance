
-- Criar trigger para forçar valores negativos em saldos iniciais de passivos
CREATE OR REPLACE FUNCTION enforce_liability_negative_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a conta é um passivo, garantir que o valor seja negativo
  IF EXISTS (
    SELECT 1 FROM accounts a 
    WHERE a.id = NEW.account_id 
    AND a.kind = 'liability'
  ) THEN
    -- Forçar valor negativo se for positivo
    IF NEW.amount > 0 THEN
      NEW.amount = -NEW.amount;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela account_initial_balances
CREATE TRIGGER enforce_liability_negative_balance_trigger
  BEFORE INSERT OR UPDATE ON account_initial_balances
  FOR EACH ROW
  EXECUTE FUNCTION enforce_liability_negative_balance();

-- Sanitizar dados existentes: converter valores positivos de passivos para negativos
UPDATE account_initial_balances 
SET amount = -ABS(amount)
WHERE amount > 0 
AND EXISTS (
  SELECT 1 FROM accounts a 
  WHERE a.id = account_initial_balances.account_id 
  AND a.kind = 'liability'
);

-- Garantir que existe o trigger de updated_at (caso não exista)
CREATE OR REPLACE FUNCTION account_initial_balances_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at se não existir
DROP TRIGGER IF EXISTS account_initial_balances_updated_at_trigger ON account_initial_balances;
CREATE TRIGGER account_initial_balances_updated_at_trigger
  BEFORE UPDATE ON account_initial_balances
  FOR EACH ROW
  EXECUTE FUNCTION account_initial_balances_set_updated_at();
