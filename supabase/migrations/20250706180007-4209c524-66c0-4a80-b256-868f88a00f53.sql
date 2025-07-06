
-- Remover a restrição de chave estrangeira existente
ALTER TABLE public.transacoes 
DROP CONSTRAINT IF EXISTS transacoes_recorrencia_id_fkey;

-- Renomear a coluna para refletir melhor seu propósito
ALTER TABLE public.transacoes 
RENAME COLUMN recorrencia_id TO transaction_group_id;

-- Adicionar comentário para documentar o propósito da coluna
COMMENT ON COLUMN public.transacoes.transaction_group_id IS 
'UUID usado para agrupar transações relacionadas (parcelas de cartão, assinaturas). Para recorrências reais, deve referenciar a tabela recorrencias apenas quando is_recorrente=true';

-- Criar uma função para validar referências opcionais à tabela recorrencias
CREATE OR REPLACE FUNCTION public.validate_transaction_group_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Se is_recorrente é true, transaction_group_id deve existir na tabela recorrencias
  IF NEW.is_recorrente = true AND NEW.transaction_group_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.recorrencias 
      WHERE id = NEW.transaction_group_id AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'transaction_group_id deve referenciar uma recorrência válida quando is_recorrente=true';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar a referência apenas quando necessário
CREATE TRIGGER validate_transaction_group_reference_trigger
  BEFORE INSERT OR UPDATE ON public.transacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_group_reference();
