
import { supabase } from './gemini-service.ts';
import { TransactionData, RecurrenceData } from './types.ts';
import { normalizeTransactionData } from './data-normalizer.ts';
import { fallbackAnalysis } from './gemini-service.ts';

export async function handleTransactionInsertion(
  transactions: TransactionData[],
  recurrences: RecurrenceData[],
  userId: string
): Promise<void> {
  try {
    // Insert recurrences first
    if (recurrences.length > 0) {
      const { error: recurrenceError } = await supabase
        .from('recorrencias')
        .insert(
          recurrences.map(rec => ({
            ...rec,
            user_id: userId,
          }))
        );

      if (recurrenceError) {
        console.error('Error inserting recurrences:', recurrenceError);
        throw recurrenceError;
      }
    }

    // Insert transactions
    if (transactions.length > 0) {
      const transactionsWithDefaults = transactions.map(transaction => ({
        ...transaction,
        user_id: userId,
        // Set is_paid based on transaction type
        is_paid: transaction.tipo_transacao === 'entrada' ? true : false,
      }));

      const { error: transactionError } = await supabase
        .from('transacoes')
        .insert(transactionsWithDefaults);

      if (transactionError) {
        console.error('Error inserting transactions:', transactionError);
        throw transactionError;
      }
    }

    console.log('Successfully inserted transactions and recurrences');
  } catch (error) {
    console.error('Error in handleTransactionInsertion:', error);
    throw error;
  }
}

export async function createTransaction(analysis: any, supabaseClient: any, userId: string): Promise<string> {
  try {
    // Validar dados essenciais
    if (!analysis.nome_gasto || !analysis.valor_gasto || !analysis.categoria) {
      throw new Error('Dados insuficientes para criar transação');
    }

    // Normalizar dados
    const normalizedData = normalizeTransactionData(analysis);
    
    // Preparar transação
    const transactionData = {
      ...normalizedData,
      user_id: userId,
      is_paid: normalizedData.tipo_transacao === 'entrada' ? true : false,
    };

    // Se for recorrente, criar recorrência primeiro
    if (normalizedData.is_recorrente) {
      const recurrenceData = {
        nome_recorrencia: normalizedData.nome_gasto,
        valor_recorrencia: normalizedData.valor_gasto,
        tipo_transacao: normalizedData.tipo_transacao,
        categoria: normalizedData.categoria,
        frequencia: normalizedData.frequencia || 'mensal',
        data_inicio: normalizedData.data_inicio || normalizedData.data_transacao,
        data_fim: normalizedData.data_fim,
        user_id: userId,
      };

      const { error: recurrenceError } = await supabaseClient
        .from('recorrencias')
        .insert([recurrenceData]);

      if (recurrenceError) {
        console.error('Error creating recurrence:', recurrenceError);
        throw recurrenceError;
      }
    }

    // Inserir transação
    const { error: transactionError } = await supabaseClient
      .from('transacoes')
      .insert([transactionData]);

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw transactionError;
    }

    return `✅ ${normalizedData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} "${normalizedData.nome_gasto}" de R$ ${normalizedData.valor_gasto.toFixed(2)} ${normalizedData.is_recorrente ? '(recorrente)' : ''} adicionado com sucesso!`;

  } catch (error) {
    console.error('Error in createTransaction:', error);
    return `❌ Erro ao criar transação: ${error.message}`;
  }
}

export async function viewTransactions(analysis: any, supabaseClient: any, userId: string): Promise<string> {
  try {
    let query = supabaseClient.from('transacoes').select('*').eq('user_id', userId);

    // Aplicar filtros baseados na análise
    if (analysis.filter) {
      switch (analysis.filter) {
        case 'gastos':
          query = query.eq('tipo_transacao', 'gasto');
          break;
        case 'receitas':
        case 'entradas':
          query = query.eq('tipo_transacao', 'entrada');
          break;
        case 'recorrentes':
          query = query.eq('is_recorrente', true);
          break;
      }
    }

    const { data: transactions, error } = await query.order('data_transacao', { ascending: false }).limit(10);

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    if (!transactions || transactions.length === 0) {
      return '📊 Nenhuma transação encontrada com os filtros aplicados.';
    }

    let response = `📊 Últimas ${transactions.length} transações:\n\n`;
    
    transactions.forEach((transaction, index) => {
      const valor = parseFloat(transaction.valor_gasto);
      const tipo = transaction.tipo_transacao === 'entrada' ? '💰' : '💸';
      response += `${index + 1}. ${tipo} ${transaction.nome_gasto} - R$ ${valor.toFixed(2)} (${transaction.data_transacao})\n`;
    });

    return response;

  } catch (error) {
    console.error('Error in viewTransactions:', error);
    return `❌ Erro ao buscar transações: ${error.message}`;
  }
}

export async function editTransaction(analysis: any, supabaseClient: any, userId: string): Promise<string> {
  try {
    if (!analysis.nome_gasto) {
      return '❌ Nome da transação é obrigatório para edição.';
    }

    // Buscar transação pelo nome
    const { data: transactions, error: searchError } = await supabaseClient
      .from('transacoes')
      .select('*')
      .eq('user_id', userId)
      .ilike('nome_gasto', `%${analysis.nome_gasto}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError) {
      console.error('Error searching transaction:', searchError);
      throw searchError;
    }

    if (!transactions || transactions.length === 0) {
      return `❌ Nenhuma transação encontrada com o nome "${analysis.nome_gasto}".`;
    }

    const transaction = transactions[0];

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (analysis.valor_gasto !== undefined) {
      updateData.valor_gasto = analysis.valor_gasto;
    }
    if (analysis.categoria) {
      updateData.categoria = analysis.categoria;
    }
    if (analysis.data_transacao) {
      updateData.data_transacao = analysis.data_transacao;
    }

    // Atualizar transação
    const { error: updateError } = await supabaseClient
      .from('transacoes')
      .update(updateData)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    return `✅ Transação "${transaction.nome_gasto}" atualizada com sucesso!`;

  } catch (error) {
    console.error('Error in editTransaction:', error);
    return `❌ Erro ao editar transação: ${error.message}`;
  }
}

export async function deleteTransaction(analysis: any, supabaseClient: any, userId: string): Promise<string> {
  try {
    if (!analysis.nome_gasto) {
      return '❌ Nome é obrigatório para exclusão.';
    }

    const targetType = analysis.target_type || 'transacao';

    if (targetType === 'recorrencia') {
      // Deletar recorrência
      const { data: recurrences, error: searchError } = await supabaseClient
        .from('recorrencias')
        .select('*')
        .eq('user_id', userId)
        .ilike('nome_recorrencia', `%${analysis.nome_gasto}%`)
        .limit(1);

      if (searchError) {
        console.error('Error searching recurrence:', searchError);
        throw searchError;
      }

      if (!recurrences || recurrences.length === 0) {
        return `❌ Nenhuma recorrência encontrada com o nome "${analysis.nome_gasto}".`;
      }

      const { error: deleteError } = await supabaseClient
        .from('recorrencias')
        .delete()
        .eq('id', recurrences[0].id);

      if (deleteError) {
        console.error('Error deleting recurrence:', deleteError);
        throw deleteError;
      }

      return `✅ Recorrência "${recurrences[0].nome_recorrencia}" excluída com sucesso!`;

    } else {
      // Deletar transação
      const { data: transactions, error: searchError } = await supabaseClient
        .from('transacoes')
        .select('*')
        .eq('user_id', userId)
        .ilike('nome_gasto', `%${analysis.nome_gasto}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (searchError) {
        console.error('Error searching transaction:', searchError);
        throw searchError;
      }

      if (!transactions || transactions.length === 0) {
        return `❌ Nenhuma transação encontrada com o nome "${analysis.nome_gasto}".`;
      }

      const { error: deleteError } = await supabaseClient
        .from('transacoes')
        .delete()
        .eq('id', transactions[0].id);

      if (deleteError) {
        console.error('Error deleting transaction:', deleteError);
        throw deleteError;
      }

      return `✅ Transação "${transactions[0].nome_gasto}" excluída com sucesso!`;
    }

  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    return `❌ Erro ao excluir: ${error.message}`;
  }
}

export async function handleFallbackTransaction(message: string, supabaseClient: any, userId: string, geminiApiKey: string): Promise<string | null> {
  try {
    console.log('Attempting fallback analysis for message:', message);
    
    const fallbackData = await fallbackAnalysis(message, geminiApiKey);
    
    if (!fallbackData.candidates || !fallbackData.candidates[0] || !fallbackData.candidates[0].content) {
      return null;
    }

    const fallbackText = fallbackData.candidates[0].content.parts[0].text;
    console.log('Fallback analysis text:', fallbackText);

    let fallbackAnalysis: any;
    try {
      const jsonMatch = fallbackText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta do fallback');
      }
      fallbackAnalysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Erro ao parsear análise do fallback:', parseError);
      return null;
    }

    // Normalizar e criar transação usando o fallback
    const normalizedData = normalizeTransactionData(fallbackAnalysis);
    
    const transactionData = {
      ...normalizedData,
      user_id: userId,
      is_paid: normalizedData.tipo_transacao === 'entrada' ? true : false,
    };

    const { error: transactionError } = await supabaseClient
      .from('transacoes')
      .insert([transactionData]);

    if (transactionError) {
      console.error('Error creating fallback transaction:', transactionError);
      throw transactionError;
    }

    return `✅ ${normalizedData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} "${normalizedData.nome_gasto}" de R$ ${normalizedData.valor_gasto.toFixed(2)} adicionado com sucesso!`;

  } catch (error) {
    console.error('Error in handleFallbackTransaction:', error);
    return null;
  }
}
