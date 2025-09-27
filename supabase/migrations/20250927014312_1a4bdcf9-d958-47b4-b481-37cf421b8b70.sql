-- Corrigir o lançamento VSCO existente que foi salvo com valor positivo
UPDATE transactions 
SET amount = -79.90 
WHERE description ILIKE '%vsco%' 
  AND amount = 79.90 
  AND type = 'despesa';