import { normalizeTransactionData } from './data-normalizer.ts';

// Função para calcular datas de pagamento do cartão de crédito
function calculateCreditCardPaymentDates(purchaseDate: Date, closingDay: number, paymentDay: number, installments: number): Date[] {
  const dates: Date[] = [];
  const purchase = new Date(purchaseDate);
  
  // Se a compra foi após o fechamento do mês atual, a primeira parcela é no mês seguinte
  let firstPaymentMonth = purchase.getMonth();
  let firstPaymentYear = purchase.getFullYear();
  
  if (purchase.getDate() > closingDay) {
    firstPaymentMonth += 1;
    if (firstPaymentMonth > 11) {
      firstPaymentMonth = 0;
      firstPaymentYear += 1;
    }
  }
  
  // Gerar datas das parcelas
  for (let i = 0; i < installments; i++) {
    const paymentMonth = firstPaymentMonth + i;
    const paymentYear = firstPaymentYear + Math.floor(paymentMonth / 12);
    const adjustedMonth = paymentMonth % 12;
    
    const paymentDate = new Date(paymentYear, adjustedMonth, paymentDay);
    dates.push(paymentDate);
  }
  
  return dates;
}

// Função para gerar UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function createTransaction(analysis: any, supabase: any, userId: string): Promise<string> {
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Validar dados da transação antes de inserir
  if (!analysis.nome_gasto || analysis.nome_gasto.trim() === '') {
    console.error('🔴 Campo nome_gasto está vazio:', analysis);
    throw new Error("Não consegui identificar o nome da transação. Tente ser mais específico.");
  }

  if (!analysis.valor_gasto || isNaN(Number(analysis.valor_gasto))) {
    console.error('🔴 Campo valor_gasto inválido:', analysis);
    throw new Error("Não consegui identificar o valor da transação. Por favor, informe um valor numérico.");
  }

  if (!analysis.tipo_transacao || (analysis.tipo_transacao !== 'entrada' && analysis.tipo_transacao !== 'gasto')) {
    console.error('🔴 Campo tipo_transacao inválido:', analysis);
    throw new Error("Não consegui identificar se é uma receita ou gasto. Tente ser mais claro.");
  }

  if (!analysis.categoria || analysis.categoria.trim() === '') {
    console.error('🟡 Campo categoria está vazio, usando padrão:', analysis);
    analysis.categoria = analysis.tipo_transacao === 'entrada' ? 'Outros' : 'Outros';
  }

  console.log('🟢 Dados da transação validados:', JSON.stringify(analysis, null, 2));
  
  // Verificar se é transação de cartão de crédito
  if (analysis.purchase_date && (analysis.installments > 1 || analysis.is_subscription)) {
    console.log('💳 Processando transação de cartão de crédito...');
    
    // Buscar configurações do cartão de crédito
    const { data: creditSettings, error: creditError } = await supabase
      .from('credit_card_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (creditError || !creditSettings || !creditSettings.enabled) {
      console.log('🟡 Configurações do cartão não encontradas ou desabilitadas, usando configurações padrão');
      // Usar configurações padrão se não houver configuração do usuário
      const closingDay = 6;
      const paymentDay = 10;
      return await processCreditCardTransaction(analysis, supabase, userId, closingDay, paymentDay);
    }

    console.log('🟢 Configurações do cartão encontradas:', creditSettings);
    return await processCreditCardTransaction(analysis, supabase, userId, creditSettings.closing_day, creditSettings.payment_day);
  }
  
  // Processar transação normal (não cartão de crédito)
  if (analysis.is_recorrente && analysis.frequencia) {
    console.log('🔄 Processando transação recorrente...');
    const dataInicio = analysis.data_inicio || analysis.data_transacao || currentDate;
    
    const { data: recorrenciaData, error: recorrenciaError } = await supabase
      .from('recorrencias')
      .insert([{
        user_id: userId,
        nome_recorrencia: analysis.nome_gasto,
        valor_recorrencia: Number(analysis.valor_gasto),
        tipo_transacao: analysis.tipo_transacao,
        categoria: analysis.categoria,
        frequencia: analysis.frequencia,
        data_inicio: dataInicio,
        data_fim: analysis.data_fim || null,
      }])
      .select();

    if (recorrenciaError) {
      console.error('🔴 Erro ao inserir recorrência:', recorrenciaError);
      throw new Error('Erro ao registrar transação recorrente');
    }

    // Gerar transações futuras a partir da data de início
    const transacoesToInsert = [];
    let currentTransactionDate = new Date(dataInicio);
    const endDate = analysis.data_fim ? new Date(analysis.data_fim) : null;
    const maxIterations = 24; // Limite de 24 iterações para evitar loops infinitos
    let iterations = 0;

    while (iterations < maxIterations) {
      // Para se a data atual exceder a data de fim
      if (endDate && currentTransactionDate > endDate) {
        break;
      }

      // Adiciona a transação para a data atual
      transacoesToInsert.push({
        user_id: userId,
        nome_gasto: analysis.nome_gasto,
        valor_gasto: Number(analysis.valor_gasto),
        tipo_transacao: analysis.tipo_transacao,
        categoria: analysis.categoria,
        data_transacao: currentTransactionDate.toISOString().split('T')[0],
        is_recorrente: true,
        recorrencia_id: recorrenciaData[0].id,
      });

      // Avança currentTransactionDate para a próxima ocorrência baseado na frequência
      switch (analysis.frequencia.toLowerCase()) {
        case 'diaria':
        case 'diário':
          currentTransactionDate.setDate(currentTransactionDate.getDate() + 1);
          break;
        case 'semanal':
          currentTransactionDate.setDate(currentTransactionDate.getDate() + 7);
          break;
        case 'mensal':
          currentTransactionDate.setMonth(currentTransactionDate.getMonth() + 1);
          break;
        case 'anual':
          currentTransactionDate.setFullYear(currentTransactionDate.getFullYear() + 1);
          break;
        default:
          // Se a frequência não for reconhecida, assume mensal
          currentTransactionDate.setMonth(currentTransactionDate.getMonth() + 1);
          break;
      }

      iterations++;
    }

    // Inserir todas as transações geradas
    if (transacoesToInsert.length > 0) {
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert(transacoesToInsert);

      if (transacaoError) {
        console.error('🔴 Erro ao inserir transações recorrentes:', transacaoError);
        throw new Error('Erro ao registrar transações recorrentes');
      }
    }

    return `✅ Transação recorrente registrada! 
📝 ${analysis.nome_gasto} - ${analysis.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(analysis.valor_gasto).toFixed(2)}
🔄 Frequência: ${analysis.frequencia}
📂 Categoria: ${analysis.categoria}
📅 Data de início: ${new Date(dataInicio).toLocaleDateString('pt-BR')}
🔢 ${transacoesToInsert.length} transações geradas`;
  } else {
    console.log('💰 Processando transação simples...');
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
      console.error('🔴 Erro ao inserir transação:', transacaoError);
      throw new Error('Erro ao registrar transação');
    }

    return `✅ Transação registrada! 
📝 ${analysis.nome_gasto} - ${analysis.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(analysis.valor_gasto).toFixed(2)}
📂 Categoria: ${analysis.categoria}
📅 Data: ${new Date(analysis.data_transacao || currentDate).toLocaleDateString('pt-BR')}`;
  }
}

async function processCreditCardTransaction(analysis: any, supabase: any, userId: string, closingDay: number, paymentDay: number): Promise<string> {
  const purchaseDate = new Date(analysis.purchase_date);
  const recurrenceId = generateUUID();
  
  console.log(`💳 Processando compra no cartão:
    📅 Data da compra: ${purchaseDate.toLocaleDateString('pt-BR')}
    💰 Valor total: R$ ${analysis.total_amount?.toFixed(2) || analysis.valor_gasto.toFixed(2)}
    🔢 Parcelas: ${analysis.installments || 1}
    📅 Dia de fechamento: ${closingDay}
    📅 Dia de pagamento: ${paymentDay}
    🆔 ID de agrupamento: ${recurrenceId}`);

  let transactionsToInsert = [];

  if (analysis.is_subscription) {
    console.log('📺 Processando assinatura mensal...');
    // Para assinaturas, gerar 12 meses de cobrança
    const subscriptionDates = calculateCreditCardPaymentDates(purchaseDate, closingDay, paymentDay, 12);
    
    for (let i = 0; i < 12; i++) {
      transactionsToInsert.push({
        user_id: userId,
        nome_gasto: analysis.nome_gasto,
        valor_gasto: Number(analysis.valor_gasto),
        tipo_transacao: analysis.tipo_transacao,
        categoria: analysis.categoria,
        data_transacao: subscriptionDates[i].toISOString().split('T')[0],
        purchase_date: analysis.purchase_date,
        total_amount: Number(analysis.valor_gasto), // Para assinaturas, o valor mensal é o total
        installments: 1,
        is_subscription: true,
        recorrencia_id: recurrenceId,
        is_paid: false,
      });
    }
    
    console.log(`📺 Geradas 12 cobranças mensais da assinatura`);
  } else if (analysis.installments > 1) {
    console.log('🔢 Processando compra parcelada...');
    // Para compras parceladas
    const installmentDates = calculateCreditCardPaymentDates(purchaseDate, closingDay, paymentDay, analysis.installments);
    const installmentValue = analysis.total_amount / analysis.installments;
    
    for (let i = 0; i < analysis.installments; i++) {
      transactionsToInsert.push({
        user_id: userId,
        nome_gasto: `${analysis.nome_gasto} (${i + 1}/${analysis.installments})`,
        valor_gasto: Number(installmentValue.toFixed(2)),
        tipo_transacao: analysis.tipo_transacao,
        categoria: analysis.categoria,
        data_transacao: installmentDates[i].toISOString().split('T')[0],
        purchase_date: analysis.purchase_date,
        total_amount: Number(analysis.total_amount),
        installments: analysis.installments,
        is_subscription: false,
        recorrencia_id: recurrenceId,
        is_paid: false,
      });
    }
    
    console.log(`🔢 Geradas ${analysis.installments} parcelas de R$ ${installmentValue.toFixed(2)}`);
  } else {
    console.log('💳 Processando compra à vista no cartão...');
    // Compra à vista no cartão
    const paymentDates = calculateCreditCardPaymentDates(purchaseDate, closingDay, paymentDay, 1);
    
    transactionsToInsert.push({
      user_id: userId,
      nome_gasto: analysis.nome_gasto,
      valor_gasto: Number(analysis.valor_gasto),
      tipo_transacao: analysis.tipo_transacao,
      categoria: analysis.categoria,
      data_transacao: paymentDates[0].toISOString().split('T')[0],
      purchase_date: analysis.purchase_date,
      total_amount: Number(analysis.valor_gasto),
      installments: 1,
      is_subscription: false,
      recorrencia_id: recurrenceId,
      is_paid: false,
    });
  }

  console.log(`💾 Inserindo ${transactionsToInsert.length} transações no banco de dados...`);

  // Inserir todas as transações em lote
  const { error: insertError } = await supabase
    .from('transacoes')
    .insert(transactionsToInsert);

  if (insertError) {
    console.error('🔴 Erro ao inserir transações de cartão de crédito:', insertError);
    throw new Error('Erro ao registrar transações do cartão de crédito');
  }

  console.log('🟢 Transações de cartão de crédito inseridas com sucesso!');

  // Construir mensagem de resposta
  if (analysis.is_subscription) {
    return `✅ Assinatura registrada no cartão de crédito! 
📝 ${analysis.nome_gasto} - Assinatura mensal de R$ ${Number(analysis.valor_gasto).toFixed(2)}
💳 Método: Cartão de Crédito
📂 Categoria: ${analysis.categoria}
📅 Data da compra: ${new Date(analysis.purchase_date).toLocaleDateString('pt-BR')}
🔢 12 cobranças mensais geradas
💳 Primeira cobrança: ${new Date(transactionsToInsert[0].data_transacao).toLocaleDateString('pt-BR')}`;
  } else if (analysis.installments > 1) {
    return `✅ Compra parcelada registrada no cartão de crédito! 
📝 ${analysis.nome_gasto} - R$ ${Number(analysis.total_amount).toFixed(2)} em ${analysis.installments}x
💳 Método: Cartão de Crédito
📂 Categoria: ${analysis.categoria}
📅 Data da compra: ${new Date(analysis.purchase_date).toLocaleDateString('pt-BR')}
💰 Valor das parcelas: R$ ${Number(analysis.total_amount / analysis.installments).toFixed(2)}
💳 Primeira parcela: ${new Date(transactionsToInsert[0].data_transacao).toLocaleDateString('pt-BR')}`;
  } else {
    return `✅ Compra registrada no cartão de crédito! 
📝 ${analysis.nome_gasto} - R$ ${Number(analysis.valor_gasto).toFixed(2)}
💳 Método: Cartão de Crédito
📂 Categoria: ${analysis.categoria}
📅 Data da compra: ${new Date(analysis.purchase_date).toLocaleDateString('pt-BR')}
💳 Data de pagamento: ${new Date(transactionsToInsert[0].data_transacao).toLocaleDateString('pt-BR')}`;
  }
}

export async function editTransaction(analysis: any, supabase: any, userId: string): Promise<string> {
  console.log('Iniciando edição de transação:', JSON.stringify(analysis, null, 2));

  if (!analysis.nome_gasto || analysis.nome_gasto.trim() === '') {
    throw new Error("Para editar uma transação, preciso saber qual transação você quer alterar. Tente ser mais específico sobre o nome da transação.");
  }

  try {
    // Buscar a transação mais recente com o nome especificado
    const { data: transacoes, error: searchError } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', userId)
      .eq('nome_gasto', analysis.nome_gasto)
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError) {
      console.error('Erro ao buscar transação:', searchError);
      throw new Error('Erro ao buscar a transação para edição');
    }

    if (!transacoes || transacoes.length === 0) {
      return `❌ Não encontrei nenhuma transação com o nome "${analysis.nome_gasto}". 

Tente ser mais específico ou verifique se o nome está correto. Você pode usar comandos como:
• "Mostrar minhas transações" para ver as transações disponíveis
• "Alterar a categoria da compra no mercado para Alimentação"`;
    }

    const transacao = transacoes[0];
    console.log('Transação encontrada:', JSON.stringify(transacao, null, 2));

    // Preparar dados para atualização (apenas campos que foram fornecidos)
    const updateData: any = {};
    
    if (analysis.valor_gasto && !isNaN(Number(analysis.valor_gasto))) {
      updateData.valor_gasto = Number(analysis.valor_gasto);
    }
    
    if (analysis.categoria && analysis.categoria.trim() !== '') {
      updateData.categoria = analysis.categoria;
    }
    
    if (analysis.tipo_transacao && (analysis.tipo_transacao === 'entrada' || analysis.tipo_transacao === 'gasto')) {
      updateData.tipo_transacao = analysis.tipo_transacao;
    }
    
    if (analysis.data_transacao) {
      updateData.data_transacao = analysis.data_transacao;
    }

    // Verificar se há algo para atualizar
    if (Object.keys(updateData).length === 0) {
      return `❓ Não consegui identificar o que você quer alterar na transação "${analysis.nome_gasto}". 

Tente ser mais específico, por exemplo:
• "Alterar o valor de ${analysis.nome_gasto} para R$ 50"
• "Mudar a categoria de ${analysis.nome_gasto} para Lazer"`;
    }

    console.log('Dados para atualização:', JSON.stringify(updateData, null, 2));

    // Realizar a atualização
    const { data: updatedData, error: updateError } = await supabase
      .from('transacoes')
      .update(updateData)
      .eq('id', transacao.id)
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Erro ao atualizar transação:', updateError);
      throw new Error('Erro ao atualizar a transação');
    }

    if (!updatedData || updatedData.length === 0) {
      throw new Error('Não foi possível atualizar a transação');
    }

    const transacaoAtualizada = updatedData[0];

    // Se a transação for recorrente, atualizar também a recorrência
    if (transacao.is_recorrente && transacao.recorrencia_id) {
      const recorrenciaUpdateData: any = {};
      
      if (updateData.valor_gasto) {
        recorrenciaUpdateData.valor_recorrencia = updateData.valor_gasto;
      }
      if (updateData.categoria) {
        recorrenciaUpdateData.categoria = updateData.categoria;
      }
      if (updateData.tipo_transacao) {
        recorrenciaUpdateData.tipo_transacao = updateData.tipo_transacao;
      }

      if (Object.keys(recorrenciaUpdateData).length > 0) {
        const { error: recorrenciaError } = await supabase
          .from('recorrencias')
          .update(recorrenciaUpdateData)
          .eq('id', transacao.recorrencia_id)
          .eq('user_id', userId);

        if (recorrenciaError) {
          console.error('Erro ao atualizar recorrência:', recorrenciaError);
          // Não vamos falhar a operação por causa disso, apenas loggar
        }
      }
    }

    // Construir mensagem de sucesso detalhada
    let mensagem = `✅ Transação "${transacao.nome_gasto}" atualizada com sucesso!\n\n`;
    
    mensagem += `📊 **Alterações realizadas:**\n`;
    
    if (updateData.valor_gasto) {
      mensagem += `💰 Valor: R$ ${transacao.valor_gasto.toFixed(2)} → R$ ${transacaoAtualizada.valor_gasto.toFixed(2)}\n`;
    }
    
    if (updateData.categoria) {
      mensagem += `📂 Categoria: ${transacao.categoria} → ${transacaoAtualizada.categoria}\n`;
    }
    
    if (updateData.tipo_transacao) {
      mensagem += `📈 Tipo: ${transacao.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} → ${transacaoAtualizada.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'}\n`;
    }
    
    if (updateData.data_transacao) {
      mensagem += `📅 Data: ${new Date(transacao.data_transacao).toLocaleDateString('pt-BR')} → ${new Date(transacaoAtualizada.data_transacao).toLocaleDateString('pt-BR')}\n`;
    }

    if (transacao.is_recorrente) {
      mensagem += `\n🔄 Esta transação é recorrente - as alterações também foram aplicadas à recorrência.`;
    }

    return mensagem;

  } catch (error) {
    console.error('Erro na edição de transação:', error);
    throw error;
  }
}

export async function deleteTransaction(analysis: any, supabase: any, userId: string): Promise<string> {
  console.log('Iniciando exclusão:', JSON.stringify(analysis, null, 2));

  if (!analysis.nome_gasto || analysis.nome_gasto.trim() === '') {
    throw new Error("Para excluir um item, preciso saber qual item você quer remover. Tente ser mais específico sobre o nome.");
  }

  // Determinar se é transação ou recorrência
  const isRecurrence = analysis.target_type === 'recorrencia';
  const tableName = isRecurrence ? 'recorrencias' : 'transacoes';
  const nameField = isRecurrence ? 'nome_recorrencia' : 'nome_gasto';
  const itemType = isRecurrence ? 'recorrência' : 'transação';

  try {
    // Buscar o item mais recente com o nome especificado
    const { data: items, error: searchError } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .eq(nameField, analysis.nome_gasto)
      .order('created_at', { ascending: false })
      .limit(1);

    if (searchError) {
      console.error(`Erro ao buscar ${itemType}:`, searchError);
      throw new Error(`Erro ao buscar a ${itemType} para exclusão`);
    }

    if (!items || items.length === 0) {
      return `❌ Não encontrei nenhuma ${itemType} com o nome "${analysis.nome_gasto}". 

Tente ser mais específico ou verifique se o nome está correto. Você pode usar comandos como:
• "Mostrar minhas transações" para ver as transações disponíveis
• "Mostrar transações recorrentes" para ver as recorrências disponíveis`;
    }

    const item = items[0];
    console.log(`${itemType} encontrada:`, JSON.stringify(item, null, 2));

    // Se for uma recorrência, também excluir as transações relacionadas
    if (isRecurrence) {
      const { error: deleteTransactionsError } = await supabase
        .from('transacoes')
        .delete()
        .eq('user_id', userId)
        .eq('recorrencia_id', item.id);

      if (deleteTransactionsError) {
        console.error('Erro ao excluir transações da recorrência:', deleteTransactionsError);
        // Não vamos falhar a operação por causa disso, apenas loggar
      }
    }

    // Excluir o item principal
    const { error: deleteError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', item.id)
      .eq('user_id', userId);

    if (deleteError) {
      console.error(`Erro ao excluir ${itemType}:`, deleteError);
      throw new Error(`Erro ao excluir a ${itemType}`);
    }

    // Construir mensagem de sucesso
    let mensagem = `✅ ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} "${analysis.nome_gasto}" excluída com sucesso!\n\n`;
    
    if (isRecurrence) {
      mensagem += `🗑️ **Recorrência removida:**\n`;
      mensagem += `💰 Valor: R$ ${item.valor_recorrencia.toFixed(2)}\n`;
      mensagem += `🔄 Frequência: ${item.frequencia}\n`;
      mensagem += `📂 Categoria: ${item.categoria}\n`;
      mensagem += `📅 Período: ${new Date(item.data_inicio).toLocaleDateString('pt-BR')}`;
      
      if (item.data_fim) {
        mensagem += ` até ${new Date(item.data_fim).toLocaleDateString('pt-BR')}`;
      }
      
      mensagem += `\n\n🔗 Todas as transações relacionadas a esta recorrência também foram removidas.`;
    } else {
      mensagem += `🗑️ **Transação removida:**\n`;
      mensagem += `💰 Valor: R$ ${item.valor_gasto.toFixed(2)}\n`;
      mensagem += `📊 Tipo: ${item.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'}\n`;
      mensagem += `📂 Categoria: ${item.categoria}\n`;
      mensagem += `📅 Data: ${new Date(item.data_transacao).toLocaleDateString('pt-BR')}`;
      
      if (item.is_recorrente) {
        mensagem += `\n\n⚠️ Esta era uma transação recorrente. A recorrência ainda está ativa e pode gerar novas transações.`;
      }
    }

    return mensagem;

  } catch (error) {
    console.error(`Erro na exclusão de ${itemType}:`, error);
    throw error;
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

    // Apply filters
    if (analysis.filter === 'gastos') {
      query = query.eq('tipo_transacao', 'gasto');
    } else if (analysis.filter === 'receitas' || analysis.filter === 'entradas') {
      query = query.eq('tipo_transacao', 'entrada');
    } else if (analysis.filter === 'recorrentes') {
      query = query.eq('is_recorrente', true);
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
        const recorrente = trans.is_recorrente ? ' 🔄' : '';
        responseMessage += `${index + 1}. ${emoji} **${trans.nome_gasto}**${recorrente}\n`;
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
