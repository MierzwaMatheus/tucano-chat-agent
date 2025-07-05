
-- Criar tabela de recorrências
CREATE TABLE public.recorrencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_recorrencia TEXT NOT NULL,
  valor_recorrencia NUMERIC NOT NULL,
  tipo_transacao TEXT NOT NULL CHECK (tipo_transacao IN ('entrada', 'gasto')),
  categoria TEXT NOT NULL,
  frequencia TEXT NOT NULL CHECK (frequencia IN ('diaria', 'semanal', 'mensal', 'anual')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de transações
CREATE TABLE public.transacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_gasto TEXT NOT NULL,
  valor_gasto NUMERIC NOT NULL,
  tipo_transacao TEXT NOT NULL CHECK (tipo_transacao IN ('entrada', 'gasto')),
  categoria TEXT NOT NULL,
  data_transacao DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_recorrente BOOLEAN DEFAULT false,
  recorrencia_id UUID REFERENCES public.recorrencias(id) ON DELETE SET NULL
);

-- Habilitar RLS (Row Level Security) para ambas as tabelas
ALTER TABLE public.recorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabela recorrencias
CREATE POLICY "Users can view their own recorrencias" 
  ON public.recorrencias 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recorrencias" 
  ON public.recorrencias 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recorrencias" 
  ON public.recorrencias 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recorrencias" 
  ON public.recorrencias 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para tabela transacoes
CREATE POLICY "Users can view their own transacoes" 
  ON public.transacoes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transacoes" 
  ON public.transacoes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transacoes" 
  ON public.transacoes 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transacoes" 
  ON public.transacoes 
  FOR DELETE 
  USING (auth.uid() = user_id);
