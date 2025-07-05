
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

// Função para normalizar campos de transação
function normalizeTransactionData(data: any): any {
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
    
    const analysisPrompt = `**IMPORTANTE: Responda APENAS com um objeto JSON plano, sem aninhamento, usando EXATAMENTE os nomes de campos especificados abaixo.**

Analise a seguinte mensagem do usuário e determine qual ação ele deseja realizar.

Possíveis ações:
1. "create" - Criar nova transação (ex: "Gastei 50 no mercado", "Recebo salário de 3000")
2. "view" - Visualizar transações (ex: "Mostrar meus gastos", "Ver minhas receitas", "Quais minhas transações recorrentes")
3. "edit" - Editar transação (ex: "Mudar o valor do mercado para 60", "Alterar categoria de freelance")
4. "delete" - Excluir transação (ex: "Excluir gasto do cinema", "Remover Netflix")

**FORMATO DE RESPOSTA OBRIGATÓRIO:**
Para ação "create", responda com JSON no formato:
{
  "action": "create",
  "nome_gasto": "nome da transação",
  "valor_gasto": valor_numérico,
  "tipo_transacao": "entrada" ou "gasto",
  "categoria": "categoria_válida",
  "data_transacao": "YYYY-MM-DD",
  "is_recorrente": true/false,
  "frequencia": "mensal/semanal/diaria/anual" (opcional),
  "data_inicio": "YYYY-MM-DD" (opcional),
  "data_fim": "YYYY-MM-DD" (opcional)
}

Para outras ações:
{ "action": "view", "type": "transactions", "filter": "gastos" }
{ "action": "edit", "description": "descrição da edição" }
{ "action": "delete", "description": "descrição da exclusão" }

**Categorias Válidas:**
- Gastos: Mercado, Comida, Casa, Lazer, Transporte, Diversão, Educação, Investimento, Assinatura, Outros
- Receitas: Salário, Adiantamento, Freelancer, Investimentos, Venda, Outros

**Exemplos EXATOS:**
"Gastei 50 no mercado" → {"action": "create", "nome_gasto": "Mercado", "valor_gasto": 50, "tipo_transacao": "gasto", "categoria": "Mercado", "data_transacao": "${currentDate}", "is_recorrente": false}
"Salário de 3000" → {"action": "create", "nome_gasto": "Salário", "valor_gasto": 3000, "tipo_transacao": "entrada", "categoria": "Salário", "data_transacao": "${currentDate}", "is_recorrente": false}

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
      
      // Lógica de desaninhamento: se houver chave 'transaction', extrair
      if (analysis.transaction && typeof analysis.transaction === 'object') {
        analysis = { ...analysis, ...analysis.transaction };
        delete analysis.transaction;
      }
      
      // Normalizar campos se for uma criação de transação
      if (analysis.action === 'create' || (!analysis.action && analysis.nome_gasto)) {
        analysis = normalizeTransactionData(analysis);
        if (!analysis.action) {
          analysis.action = 'create';
        }
      }
      
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
        if (!analysis.nome_gasto || analysis.nome_gasto.trim() === '') {
          console.error('Campo nome_gasto está vazio:', analysis);
          return new Response(JSON.stringify({ 
            message: "Não consegui identificar o nome da transação. Tente ser mais específico." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!analysis.valor_gasto || isNaN(Number(analysis.valor_gasto))) {
          console.error('Campo valor_gasto inválido:', analysis);
          return new Response(JSON.stringify({ 
            message: "Não consegui identificar o valor da transação. Por favor, informe um valor numérico." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!analysis.tipo_transacao || (analysis.tipo_transacao !== 'entrada' && analysis.tipo_transacao !== 'gasto')) {
          console.error('Campo tipo_transacao inválido:', analysis);
          return new Response(JSON.stringify({ 
            message: "Não consegui identificar se é uma receita ou gasto. Tente ser mais claro." 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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
              user_id: user.id,
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
              user_id: user.id,
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

          responseMessage = `✅ Transação recorrente registrada! 
📝 ${analysis.nome_gasto} - ${analysis.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(analysis.valor_gasto).toFixed(2)}
🔄 Frequência: ${analysis.frequencia}
📂 Categoria: ${analysis.categoria}`;
        } else {
          const { error: transacaoError } = await supabase
            .from('transacoes')
            .insert([{
              user_id: user.id,
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

          responseMessage = `✅ Transação registrada! 
📝 ${analysis.nome_gasto} - ${analysis.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${Number(analysis.valor_gasto).toFixed(2)}
📂 Categoria: ${analysis.categoria}
📅 Data: ${new Date(analysis.data_transacao || currentDate).toLocaleDateString('pt-BR')}`;
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
        // Fallback melhorado - tentar processar como transação diretamente
        const fallbackPrompt = `**RESPONDA APENAS COM UM OBJETO JSON PLANO. NÃO ADICIONE TEXTO ANTES OU DEPOIS DO JSON.**

Extraia as informações financeiras da frase do usuário. Use EXATAMENTE estes nomes de campos:

**Campos obrigatórios no JSON:**
- nome_gasto: (string) Nome/descrição da transação
- valor_gasto: (number) Valor numérico
- tipo_transacao: (string) "entrada" ou "gasto"  
- categoria: (string) Categoria da lista válida
- data_transacao: (string) Data no formato YYYY-MM-DD
- is_recorrente: (boolean) true/false

**Categorias válidas:**
Gastos: Mercado, Comida, Casa, Lazer, Transporte, Diversão, Educação, Investimento, Assinatura, Outros
Receitas: Salário, Adiantamento, Freelancer, Investimentos, Venda, Outros

**Exemplos:**
"Gastei 50 no mercado" → {"nome_gasto": "Mercado", "valor_gasto": 50, "tipo_transacao": "gasto", "categoria": "Mercado", "data_transacao": "${currentDate}", "is_recorrente": false}

Frase: "${message}"`;

        const fallbackResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: fallbackPrompt
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
                let transactionData = JSON.parse(jsonMatch[0]);
                
                // Normalizar dados do fallback
                transactionData = normalizeTransactionData(transactionData);
                
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
                  } else {
                    console.error('Erro ao inserir transação no fallback:', transacaoError);
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
