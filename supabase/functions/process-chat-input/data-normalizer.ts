
// Função para normalizar campos de transação
export function normalizeTransactionData(data: any): any {
  const normalized = { ...data };
  
  // Normalizar nome_gasto
  if (!normalized.nome_gasto) {
    normalized.nome_gasto = data.nome_transacao || data.descricao || data.nome || 'Não Especificado';
  }
  
  // Normalizar valor_gasto
  if (!normalized.valor_gasto && normalized.valor_gasto !== 0) {
    normalized.valor_gasto = data.valor_transacao || data.valor || 0;
  }
  
  // Normalizar tipo_transacao
  if (!normalized.tipo_transacao) {
    normalized.tipo_transacao = data.tipo || 'gasto';
  }
  
  // Normalizar categoria
  if (!normalized.categoria) {
    normalized.categoria = data.categoria || 'Outros';
  }
  
  // Remover campos antigos/duplicados
  delete normalized.nome_transacao;
  delete normalized.valor_transacao;
  delete normalized.descricao;
  delete normalized.nome;
  delete normalized.valor;
  delete normalized.tipo;
  
  return normalized;
}
