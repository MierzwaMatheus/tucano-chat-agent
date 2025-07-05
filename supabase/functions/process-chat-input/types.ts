
export interface TransactionData {
  nome_gasto: string;
  valor_gasto: number;
  tipo_transacao: 'entrada' | 'gasto';
  categoria: string;
  data_transacao: string;
  is_recorrente: boolean;
  frequencia?: 'diaria' | 'semanal' | 'mensal' | 'anual';
  data_inicio?: string;
  data_fim?: string;
}

export interface ChatOperation {
  action: 'create' | 'view' | 'edit' | 'delete';
  type?: 'transactions' | 'recurring' | 'summary';
  filter?: string;
  transactionId?: string;
  updates?: Partial<TransactionData>;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
