
import { normalizeTransactionData } from './data-normalizer.ts';

export async function createTransaction(analysis: any, supabase: any, userId: string): Promise<string> {
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Validar dados da transação antes de inserir
  if (!analysis.nome_gasto || analysis.nome_gasto.trim() === '') {
    console.error('Campo nome_gasto está vazio:', analysis);
    throw new Error("Não consegui identificar o nome da transação. Tente ser mais específico.");
  }

  if (!analysis.valor_gasto || isNaN(Number(analysis.valor_gasto))) {
    console.error('Campo valor_gasto inválido:', analysis);
    throw new Error("Não consegui identificar o valor da transação. Por favor, informe um valor numérico.");
  }

  if (!analysis.tipo_transacao || (analysis.tipo_transacao !== 'entrada' && analysis.tipo_transacao !== 'gasto')) {
    console.error('Campo tipo_transacao inválido:', analysis);
    throw new Error("Não consegui identificar se é uma receita ou gasto. Tente ser mais claro.");
  }

  if (!analysis.categoria || analysis.categoria.trim() === '') {
    console.error('Campo categoria está vazio:', analysis);
    analysis.categoria = analysis.tipo_transacao === 'entrada' ? 'Outros' : 'Outros';
  }

  // Log dos dados antes de inserir
  console.log('Dados da transação validados:', JSON.stringify(analysis, null, 2));
  
  if (analysis.is_recorrente && analysis.frequencia) {
    const { data: recorrenciaData, error: recorrenciaError } = await supabase
      .from('recorrencias')
      .insert([{
        user_id: userId,
        nome_recorrencia: analysis.nome_gasto,
        valor_recorrencia: Number(analysis.valor_gasto),
        tipo_transacao: analysis.tipo_transacao,
        categoria: analysis.categoria,
        frequencia: analysis.frequencia,
        data_inicio: analysis.data_inicio || currentDate,
        data_fim: analysis.data_fim || null,
      }])
      .select();

    if (recorrenciaError) {
      console.error('Erro ao inserir recorrência:', recorrenciaError);
      throw new Error('Erro ao registrar transação recorrente');
    }

    const { error: transacaoError } = await supabase
      .from('transacoes')
      .insert([{
        user_id: userId,
        nome_gasto: analysis.nome_gasto,
        valor_gasto: Number(analysis.valor_gasto),
        tipo_transacao: analysis.tipo_transacao,
        categoria: analysis.categoria,
        data_transacao: analysis.data_transacao || currentDate,
        is_recorrente: true,
        recorrencia_id: recorrenciaData[0].id,
      }]);

    if (transacaoError) {
      console.error('Erro ao inserir transação:', transacaoError);
      throw new Error('Erro ao registrar transação');
    }

    return `✅ Transação recorrente registrada! 
📝 ${analysis.nome_gasto} - ${analysis.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(analysis.valor_gasto).toFixed(2)}
🔄 Frequência: ${analysis.frequencia}
📂 Categoria: ${analysis.categoria}`;
  } else {
    const { error: transacaoError } = await supabase
      .from('transacoes')
      .insert([{
        user_id: userId,
        nome_gasto: analysis.nome_gasto,
        valor_gasto: Number(analysis.valor_gasto),
        tipo_transacao: analysis.tipo_transacao,
        categoria: analysis.categoria,
        data_transacao: analysis.data_transacao || currentDate,
        is_recorrente: false,
      }]);

    if (transacaoError) {
      console.error('Erro ao inserir transação:', transacaoError);
      throw new Error('Erro ao registrar transação');
    }

    return `✅ Transação registrada! 
📝 ${analysis.nome_gasto} - ${analysis.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(analysis.valor_gasto).toFixed(2)}
📂 Categoria: ${analysis.categoria}
📅 Data: ${new Date(analysis.data_transacao || currentDate).toLocaleDateString('pt-BR')}`;
  }
}

export async function viewTransactions(analysis: any, supabase: any, userId: string): Promise<string> {
  if (analysis.type === 'recurring') {
    const { data: recorrencias, error } = await supabase
      .from('recorrencias')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!recorrencias || recorrencias.length === 0) {
      return "📋 Você não possui transações recorrentes cadastradas.";
    } else {
      let responseMessage = "🔄 **Suas Transações Recorrentes:**\n\n";
      recorrencias.forEach((rec, index) => {
        responseMessage += `${index + 1}. **${rec.nome_recorrencia}**\n`;
        responseMessage += `   💰 R$ ${rec.valor_recorrencia.toFixed(2)} - ${rec.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'}\n`;
        responseMessage += `   📂 ${rec.categoria} | 🔄 ${rec.frequencia}\n`;
        responseMessage += `   📅 Desde: ${new Date(rec.data_inicio).toLocaleDateString('pt-BR')}\n\n`;
      });
      return responseMessage;
    }
  } else {
    let query = supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', userId);

    if (analysis.filter === 'gastos') {
      query = query.eq('tipo_transacao', 'gasto');
    } else if (analysis.filter === 'receitas' || analysis.filter === 'entradas') {
      query = query.eq('tipo_transacao', 'entrada');
    }

    const { data: transacoes, error } = await query
      .order('data_transacao', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!transacoes || transacoes.length === 0) {
      return "📋 Nenhuma transação encontrada.";
    } else {
      const totalEntradas = transacoes.filter(t => t.tipo_transacao === 'entrada').reduce((sum, t) => sum + Number(t.valor_gasto), 0);
      const totalGastos = transacoes.filter(t => t.tipo_transacao === 'gasto').reduce((sum, t) => sum + Number(t.valor_gasto), 0);
      
      let responseMessage = `📊 **Resumo das Últimas Transações:**\n`;
      responseMessage += `💚 Total Receitas: R$ ${totalEntradas.toFixed(2)}\n`;
      responseMessage += `❌ Total Gastos: R$ ${totalGastos.toFixed(2)}\n`;
      responseMessage += `💰 Saldo: R$ ${(totalEntradas - totalGastos).toFixed(2)}\n\n`;
      responseMessage += "📋 **Transações Recentes:**\n\n";
      
      transacoes.forEach((trans, index) => {
        const emoji = trans.tipo_transacao === 'entrada' ? '💚' : '❌';
        responseMessage += `${index + 1}. ${emoji} **${trans.nome_gasto}**\n`;
        responseMessage += `   💰 R$ ${trans.valor_gasto.toFixed(2)}\n`;
        responseMessage += `   📂 ${trans.categoria}\n`;
        responseMessage += `   📅 ${new Date(trans.data_transacao).toLocaleDateString('pt-BR')}\n\n`;
      });
      
      return responseMessage;
    }
  }
}

export async function handleFallbackTransaction(message: string, supabase: any, userId: string, geminiApiKey: string): Promise<string | null> {
  const { fallbackAnalysis } = await import('./gemini-service.ts');
  
  const fallbackResponse = await fallbackAnalysis(message, geminiApiKey);
  
  if (!fallbackResponse?.candidates?.[0]?.content) {
    return null;
  }

  const fallbackText = fallbackResponse.candidates[0].content.parts[0].text;
  
  try {
    const jsonMatch = fallbackText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    
    let transactionData = JSON.parse(jsonMatch[0]);
    
    // Normalizar dados do fallback
    transactionData = normalizeTransactionData(transactionData);
    
    // Validação dos campos obrigatórios
    if (transactionData.nome_gasto && transactionData.valor_gasto && transactionData.tipo_transacao && transactionData.categoria) {
      const currentDate = new Date().toISOString().split('T')[0];
      
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          user_id: userId,
          nome_gasto: transactionData.nome_gasto,
          valor_gasto: Number(transactionData.valor_gasto),
          tipo_transacao: transactionData.tipo_transacao,
          categoria: transactionData.categoria,
          data_transacao: transactionData.data_transacao || currentDate,
          is_recorrente: transactionData.is_recorrente || false,
        }]);

      if (!transacaoError) {
        return `✅ Transação registrada! 
📝 ${transactionData.nome_gasto} - ${transactionData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(transactionData.valor_gasto).toFixed(2)}
📂 Categoria: ${transactionData.categoria}
📅 Data: ${new Date(transactionData.data_transacao || currentDate).toLocaleDateString('pt-BR')}`;
      } else {
        console.error('Erro ao inserir transação no fallback:', transacaoError);
      }
    }
  } catch (e) {
    console.error('Erro no fallback:', e);
  }
  
  return null;
}
