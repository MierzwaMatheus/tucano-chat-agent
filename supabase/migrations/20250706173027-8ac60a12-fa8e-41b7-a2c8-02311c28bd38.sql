
-- Adicionar novas colunas à tabela transacoes para suporte ao cartão de crédito
ALTER TABLE public.transacoes 
ADD COLUMN purchase_date DATE,
ADD COLUMN total_amount NUMERIC,
ADD COLUMN installments INTEGER,
ADD COLUMN is_subscription BOOLEAN DEFAULT false;

-- Criar tabela de configurações do cartão de crédito
CREATE TABLE public.credit_card_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  closing_day INTEGER DEFAULT 6,
  payment_day INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela credit_card_settings
ALTER TABLE public.credit_card_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabela credit_card_settings
CREATE POLICY "Users can view their own credit card settings" 
  ON public.credit_card_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credit card settings" 
  ON public.credit_card_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credit card settings" 
  ON public.credit_card_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credit card settings" 
  ON public.credit_card_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER handle_credit_card_settings_updated_at 
  BEFORE UPDATE ON public.credit_card_settings 
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
