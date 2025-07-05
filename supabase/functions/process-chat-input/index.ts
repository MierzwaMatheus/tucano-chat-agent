
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionData {
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

interface ChatOperation {
  action: 'create' | 'view' | 'edit' | 'delete';
  type?: 'transactions' | 'recurring' | 'summary';
  filter?: string;
  transactionId?: string;
  updates?: Partial<TransactionData>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    if (!message) {
      throw new Error('Mensagem não fornecida');
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter token de autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização não fornecido');
    }

    // Definir usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Chamar Gemini API para analisar a intenção
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Chave da API Gemini não configurada');
    }

    const currentDate = new Date().toISOString().split('T')[0];
    
    const analysisPrompt = `Analise a seguinte mensagem do usuário e determine qual ação ele deseja realizar. Responda APENAS em formato JSON válido.

Possíveis ações:
1. "create" - Criar nova transação (ex: "Gastei 50 no mercado", "Recebo salário de 3000")
2. "view" - Visualizar transações (ex: "Mostrar meus gastos", "Ver minhas receitas", "Quais minhas transações recorrentes")
3. "edit" - Editar transação (ex: "Mudar o valor do mercado para 60", "Alterar categoria de freelance")
4. "delete" - Excluir transação (ex: "Excluir gasto do cinema", "Remover Netflix")

Para ação "create", extraia também os dados da transação.
Para ação "view", identifique o tipo: "transactions", "recurring", ou "summary"
Para ação "edit"/"delete", tente identificar qual transação o usuário se refere.

Exemplos de resposta:
{ "action": "create", "transaction": { "nome_gasto": "mercado", "valor_gasto": 50, "tipo_transacao": "gasto", "categoria": "Mercado", "data_transacao": "${currentDate}", "is_recorrente": false } }
{ "action": "view", "type": "transactions", "filter": "gastos" }
{ "action": "view", "type": "recurring" }
{ "action": "edit", "description": "valor do mercado para 60" }
{ "action": "delete", "description": "gasto do cinema" }

Mensagem do usuário: "${message}"`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: analysisPrompt
          }]
        }]
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Erro na API Gemini: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini analysis response:', JSON.stringify(geminiData, null, 2));
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      return new Response(JSON.stringify({ 
        message: "Desculpe, não consegui entender sua solicitação. Tente ser mais específico." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiText = geminiData.candidates[0].content.parts[0].text;
    console.log('Gemini analysis text:', geminiText);

    let analysis: any;
    try {
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Erro ao parsear análise:', parseError);
      return new Response(JSON.stringify({ 
        message: "Desculpe, não consegui processar sua solicitação. Tente reformular." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseMessage = "";

    // Processar baseado na ação identificada
    switch (analysis.action) {
      case 'create':
        // Validar dados da transação antes de inserir
        if (!analysis.transaction) {
          return new Response(JSON.stringify({ 
            message: "Não consegui extrair os dados da transação. Tente ser mais específico sobre valores e tipos." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const transactionData = analysis.transaction;
        
        // Validação rigorosa dos campos obrigatórios
        if (!transactionData.nome_gasto || transactionData.nome_gasto.trim() === '') {
          console.error('Campo nome_gasto está vazio:', transactionData);
          return new Response(JSON.stringify({ 
            message: "Não consegui identificar o nome da transação. Tente ser mais específico." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!transactionData.valor_gasto || isNaN(Number(transactionData.valor_gasto))) {
          console.error('Campo valor_gasto inválido:', transactionData);
          return new Response(JSON.stringify({ 
            message: "Não consegui identificar o valor da transação. Por favor, informe um valor numérico." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!transactionData.tipo_transacao || (transactionData.tipo_transacao !== 'entrada' && transactionData.tipo_transacao !== 'gasto')) {
          console.error('Campo tipo_transacao inválido:', transactionData);
          return new Response(JSON.stringify({ 
            message: "Não consegui identificar se é uma receita ou gasto. Tente ser mais claro." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!transactionData.categoria || transactionData.categoria.trim() === '') {
          console.error('Campo categoria está vazio:', transactionData);
          // Definir categoria padrão baseada no tipo
          transactionData.categoria = transactionData.tipo_transacao === 'entrada' ? 'Outros' : 'Outros';
        }

        // Log dos dados antes de inserir
        console.log('Dados da transação validados:', JSON.stringify(transactionData, null, 2));
        
        if (transactionData.is_recorrente && transactionData.frequencia) {
          const { data: recorrenciaData, error: recorrenciaError } = await supabase
            .from('recorrencias')
            .insert([{
              user_id: user.id,
              nome_recorrencia: transactionData.nome_gasto,
              valor_recorrencia: Number(transactionData.valor_gasto),
              tipo_transacao: transactionData.tipo_transacao,
              categoria: transactionData.categoria,
              frequencia: transactionData.frequencia,
              data_inicio: transactionData.data_inicio || currentDate,
              data_fim: transactionData.data_fim || null,
            }])
            .select();

          if (recorrenciaError) {
            console.error('Erro ao inserir recorrência:', recorrenciaError);
            throw new Error('Erro ao registrar transação recorrente');
          }

          const { error: transacaoError } = await supabase
            .from('transacoes')
            .insert([{
              user_id: user.id,
              nome_gasto: transactionData.nome_gasto,
              valor_gasto: Number(transactionData.valor_gasto),
              tipo_transacao: transactionData.tipo_transacao,
              categoria: transactionData.categoria,
              data_transacao: transactionData.data_transacao || currentDate,
              is_recorrente: true,
              recorrencia_id: recorrenciaData[0].id,
            }]);

          if (transacaoError) {
            console.error('Erro ao inserir transação:', transacaoError);
            throw new Error('Erro ao registrar transação');
          }

          responseMessage = `✅ Transação recorrente registrada! 
📝 ${transactionData.nome_gasto} - ${transactionData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(transactionData.valor_gasto).toFixed(2)}
🔄 Frequência: ${transactionData.frequencia}
📂 Categoria: ${transactionData.categoria}`;
        } else {
          const { error: transacaoError } = await supabase
            .from('transacoes')
            .insert([{
              user_id: user.id,
              nome_gasto: transactionData.nome_gasto,
              valor_gasto: Number(transactionData.valor_gasto),
              tipo_transacao: transactionData.tipo_transacao,
              categoria: transactionData.categoria,
              data_transacao: transactionData.data_transacao || currentDate,
              is_recorrente: false,
            }]);

          if (transacaoError) {
            console.error('Erro ao inserir transação:', transacaoError);
            throw new Error('Erro ao registrar transação');
          }

          responseMessage = `✅ Transação registrada! 
📝 ${transactionData.nome_gasto} - ${transactionData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(transactionData.valor_gasto).toFixed(2)}
📂 Categoria: ${transactionData.categoria}
📅 Data: ${new Date(transactionData.data_transacao || currentDate).toLocaleDateString('pt-BR')}`;
        }
        break;

      case 'view':
        if (analysis.type === 'recurring') {
          const { data: recorrencias, error } = await supabase
            .from('recorrencias')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;

          if (!recorrencias || recorrencias.length === 0) {
            responseMessage = "📋 Você não possui transações recorrentes cadastradas.";
          } else {
            responseMessage = "🔄 **Suas Transações Recorrentes:**\n\n";
            recorrencias.forEach((rec, index) => {
              responseMessage += `${index + 1}. **${rec.nome_recorrencia}**\n`;
              responseMessage += `   💰 R$ ${rec.valor_recorrencia.toFixed(2)} - ${rec.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'}\n`;
              responseMessage += `   📂 ${rec.categoria} | 🔄 ${rec.frequencia}\n`;
              responseMessage += `   📅 Desde: ${new Date(rec.data_inicio).toLocaleDateString('pt-BR')}\n\n`;
            });
          }
        } else {
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          
          let query = supabase
            .from('transacoes')
            .select('*')
            .eq('user_id', user.id);

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
            responseMessage = "📋 Nenhuma transação encontrada.";
          } else {
            const totalEntradas = transacoes.filter(t => t.tipo_transacao === 'entrada').reduce((sum, t) => sum + Number(t.valor_gasto), 0);
            const totalGastos = transacoes.filter(t => t.tipo_transacao === 'gasto').reduce((sum, t) => sum + Number(t.valor_gasto), 0);
            
            responseMessage = `📊 **Resumo das Últimas Transações:**\n`;
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
          }
        }
        break;

      case 'edit':
        responseMessage = `🔧 Para editar uma transação, preciso que você seja mais específico. Por exemplo:\n\n`;
        responseMessage += `• "Alterar o valor da última compra no mercado para R$ 60"\n`;
        responseMessage += `• "Mudar a categoria do gasto de ontem para Lazer"\n`;
        responseMessage += `• "Atualizar minha recorrência de Netflix para R$ 25"\n\n`;
        responseMessage += `Ou me diga o nome exato da transação que deseja editar.`;
        break;

      case 'delete':
        responseMessage = `🗑️ Para excluir uma transação, preciso que você seja mais específico. Por exemplo:\n\n`;
        responseMessage += `• "Excluir o gasto de R$ 20 no cinema de ontem"\n`;
        responseMessage += `• "Remover minha recorrência do Spotify"\n`;
        responseMessage += `• "Deletar a última compra no mercado"\n\n`;
        responseMessage += `Ou me diga o nome exato da transação que deseja excluir.`;
        break;

      default:
        // Se não foi possível identificar a ação, tentar processar como criação de transação
        const createPrompt = `Analise a seguinte frase e extraia o valor, tipo (entrada/gasto), categoria, uma breve descrição, data da transação, e se é uma transação recorrente. Se for recorrente, identifique a frequência (diária, semanal, mensal, anual) e a data de início/fim (se mencionada). Responda APENAS em formato JSON válido, sem texto adicional.

Categorias válidas para Gastos: Mercado, Comida, Casa, Lazer, Transporte, Diversão, Educação, Investimento, Assinatura.
Categorias válidas para Receitas: Salário, Adiantamento, Freelancer, Investimentos, Venda.

Exemplos de entrada e saída JSON:
Usuário: "Gastei 50 reais no mercado hoje."
JSON: { "nome_gasto": "mercado", "valor_gasto": 50.00, "tipo_transacao": "gasto", "categoria": "Mercado", "data_transacao": "${currentDate}", "is_recorrente": false }

Usuário: "Recebo 1500 de salário todo mês."
JSON: { "nome_gasto": "salário", "valor_gasto": 1500.00, "tipo_transacao": "entrada", "categoria": "Salário", "data_transacao": "${currentDate}", "is_recorrente": true, "frequencia": "mensal", "data_inicio": "${currentDate}", "data_fim": null }

Frase do usuário: "${message}"`;

        const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: createPrompt
              }]
            }]
          }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.candidates?.[0]?.content) {
            const fallbackText = fallbackData.candidates[0].content.parts[0].text;
            try {
              const jsonMatch = fallbackText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const transactionData = JSON.parse(jsonMatch[0]);
                
                // Validação dos campos obrigatórios
                if (transactionData.nome_gasto && transactionData.valor_gasto && transactionData.tipo_transacao && transactionData.categoria) {
                  const { error: transacaoError } = await supabase
                    .from('transacoes')
                    .insert([{
                      user_id: user.id,
                      nome_gasto: transactionData.nome_gasto,
                      valor_gasto: Number(transactionData.valor_gasto),
                      tipo_transacao: transactionData.tipo_transacao,
                      categoria: transactionData.categoria,
                      data_transacao: transactionData.data_transacao || currentDate,
                      is_recorrente: transactionData.is_recorrente || false,
                    }]);

                  if (!transacaoError) {
                    responseMessage = `✅ Transação registrada! 
📝 ${transactionData.nome_gasto} - ${transactionData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(transactionData.valor_gasto).toFixed(2)}
📂 Categoria: ${transactionData.categoria}
📅 Data: ${new Date(transactionData.data_transacao || currentDate).toLocaleDateString('pt-BR')}`;
                  }
                }
              }
            } catch (e) {
              console.error('Erro no fallback:', e);
            }
          }
        }
        
        if (!responseMessage) {
          responseMessage = "Desculpe, não consegui entender sua solicitação. Tente ser mais específico sobre transações, valores ou operações que deseja realizar.";
        }
    }

    return new Response(JSON.stringify({ message: responseMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ 
      message: `Ops! Houve um erro: ${error.message}. Tente novamente ou seja mais específico.` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
