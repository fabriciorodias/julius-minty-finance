-- Adicionar colunas para transferências na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN transfer_id uuid,
ADD COLUMN transfer_type text CHECK (transfer_type IN ('origem', 'destino')),
ADD COLUMN related_account_id uuid;

-- Criar função SQL para criar transferências atomicamente
CREATE OR REPLACE FUNCTION public.create_transfer(
  p_user_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_description text,
  p_event_date date,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(transfer_id uuid, origin_transaction_id uuid, destination_transaction_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer_id uuid;
  v_origin_tx_id uuid;
  v_dest_tx_id uuid;
BEGIN
  -- Gerar ID único para a transferência
  v_transfer_id := gen_random_uuid();
  
  -- Validar se as contas pertencem ao usuário
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_from_account_id AND user_id = p_user_id AND is_active = true) THEN
    RAISE EXCEPTION 'Account de origem não encontrada ou não pertence ao usuário';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_to_account_id AND user_id = p_user_id AND is_active = true) THEN
    RAISE EXCEPTION 'Account de destino não encontrada ou não pertence ao usuário';
  END IF;
  
  -- Validar se as contas são diferentes
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Conta de origem e destino devem ser diferentes';
  END IF;
  
  -- Criar transação de origem (débito)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description, event_date, notes,
    transfer_id, transfer_type, related_account_id, input_source
  ) VALUES (
    p_user_id, p_from_account_id, 'despesa', ABS(p_amount), p_description, p_event_date, p_notes,
    v_transfer_id, 'origem', p_to_account_id, 'manual'
  ) RETURNING id INTO v_origin_tx_id;
  
  -- Criar transação de destino (crédito)
  INSERT INTO transactions (
    user_id, account_id, type, amount, description, event_date, notes,
    transfer_id, transfer_type, related_account_id, input_source
  ) VALUES (
    p_user_id, p_to_account_id, 'receita', ABS(p_amount), p_description, p_event_date, p_notes,
    v_transfer_id, 'destino', p_from_account_id, 'manual'
  ) RETURNING id INTO v_dest_tx_id;
  
  -- Retornar IDs das transações criadas
  RETURN QUERY SELECT v_transfer_id, v_origin_tx_id, v_dest_tx_id;
END;
$$;

-- Criar função para atualizar transferências
CREATE OR REPLACE FUNCTION public.update_transfer(
  p_user_id uuid,
  p_transfer_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_description text,
  p_event_date date,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar se a transferência pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM transactions 
    WHERE transfer_id = p_transfer_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Transferência não encontrada ou não pertence ao usuário';
  END IF;
  
  -- Validar contas
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_from_account_id AND user_id = p_user_id AND is_active = true) THEN
    RAISE EXCEPTION 'Conta de origem não encontrada';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM accounts WHERE id = p_to_account_id AND user_id = p_user_id AND is_active = true) THEN
    RAISE EXCEPTION 'Conta de destino não encontrada';
  END IF;
  
  IF p_from_account_id = p_to_account_id THEN
    RAISE EXCEPTION 'Conta de origem e destino devem ser diferentes';
  END IF;
  
  -- Atualizar transação de origem
  UPDATE transactions SET
    account_id = p_from_account_id,
    amount = ABS(p_amount),
    description = p_description,
    event_date = p_event_date,
    notes = p_notes,
    related_account_id = p_to_account_id
  WHERE transfer_id = p_transfer_id AND transfer_type = 'origem' AND user_id = p_user_id;
  
  -- Atualizar transação de destino
  UPDATE transactions SET
    account_id = p_to_account_id,
    amount = ABS(p_amount),
    description = p_description,
    event_date = p_event_date,
    notes = p_notes,
    related_account_id = p_from_account_id
  WHERE transfer_id = p_transfer_id AND transfer_type = 'destino' AND user_id = p_user_id;
  
  RETURN true;
END;
$$;

-- Criar função para deletar transferências
CREATE OR REPLACE FUNCTION public.delete_transfer(
  p_user_id uuid,
  p_transfer_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar se a transferência pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM transactions 
    WHERE transfer_id = p_transfer_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Transferência não encontrada ou não pertence ao usuário';
  END IF;
  
  -- Deletar ambas transações da transferência
  DELETE FROM transactions 
  WHERE transfer_id = p_transfer_id AND user_id = p_user_id;
  
  RETURN true;
END;
$$;