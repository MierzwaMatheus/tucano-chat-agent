
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

    // Chamar Gemini API
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Chave da API Gemini não configurada');
    }

    const currentDate = new Date().toISOString().split('T')[0];
    
    const prompt = `Analise a seguinte frase e extraia o valor, tipo (entrada/gasto), categoria, uma breve descrição, data da transação, e se é uma transação recorrente. Se for recorrente, identifique a frequência (diária, semanal, mensal, anual) e a data de início/fim (se mencionada). Responda APENAS em formato JSON válido, sem texto adicional.

Categorias válidas para Gastos: Mercado, Comida, Casa, Lazer, Transporte, Diversão, Educação, Investimento, Assinatura.
Categorias válidas para Receitas: Salário, Adiantamento, Freelancer, Investimentos, Venda.

Exemplos de entrada e saída JSON:
Usuário: "Gastei 50 reais no mercado hoje."
JSON: { "nome_gasto": "mercado", "valor_gasto": 50.00, "tipo_transacao": "gasto", "categoria": "Mercado", "data_transacao": "${currentDate}", "is_recorrente": false }

Usuário: "Recebo 1500 de salário todo mês."
JSON: { "nome_gasto": "salário", "valor_gasto": 1500.00, "tipo_transacao": "entrada", "categoria": "Salário", "data_transacao": "${currentDate}", "is_recorrente": true, "frequencia": "mensal", "data_inicio": "${currentDate}", "data_fim": null }

Usuário: "Pago 100 de Netflix mensalmente."
JSON: { "nome_gasto": "Netflix", "valor_gasto": 100.00, "tipo_transacao": "gasto", "categoria": "Assinatura", "data_transacao": "${currentDate}", "is_recorrente": true, "frequencia": "mensal", "data_inicio": "${currentDate}", "data_fim": null }

Frase do usuário: "${message}"`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }),
    });

    if (!geminiResponse.ok) {
      throw new Error(`Erro na API Gemini: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      return new Response(JSON.stringify({ 
        message: "Desculpe, não consegui identificar uma transação na sua mensagem. Tente ser mais específico sobre valores, gastos ou receitas." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiText = geminiData.candidates[0].content.parts[0].text;
    console.log('Gemini text response:', geminiText);

    // Extrair JSON da resposta da Gemini
    let transactionData: TransactionData;
    try {
      // Tentar encontrar JSON na resposta
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON não encontrado na resposta');
      }
      
      transactionData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      return new Response(JSON.stringify({ 
        message: "Desculpe, não consegui identificar uma transação válida na sua mensagem. Tente ser mais específico sobre valores, gastos ou receitas." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar dados extraídos
    if (!transactionData.nome_gasto || !transactionData.valor_gasto || !transactionData.tipo_transacao || !transactionData.categoria) {
      return new Response(JSON.stringify({ 
        message: "Não consegui extrair todas as informações necessárias da sua mensagem. Tente incluir o valor, o tipo de gasto/receita e a categoria." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseMessage = "";

    // Se for recorrente, inserir na tabela recorrencias primeiro
    if (transactionData.is_recorrente && transactionData.frequencia) {
      const { data: recorrenciaData, error: recorrenciaError } = await supabase
        .from('recorrencias')
        .insert([{
          user_id: user.id,
          nome_recorrencia: transactionData.nome_gasto,
          valor_recorrencia: transactionData.valor_gasto,
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

      // Inserir a primeira transação associada à recorrência
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          user_id: user.id,
          nome_gasto: transactionData.nome_gasto,
          valor_gasto: transactionData.valor_gasto,
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

      responseMessage = `✅ Transação recorrente registrada com sucesso! 
📝 ${transactionData.nome_gasto} - ${transactionData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${transactionData.valor_gasto.toFixed(2)}
🔄 Frequência: ${transactionData.frequencia}
📂 Categoria: ${transactionData.categoria}`;
    } else {
      // Inserir transação única
      const { error: transacaoError } = await supabase
        .from('transacoes')
        .insert([{
          user_id: user.id,
          nome_gasto: transactionData.nome_gasto,
          valor_gasto: transactionData.valor_gasto,
          tipo_transacao: transactionData.tipo_transacao,
          categoria: transactionData.categoria,
          data_transacao: transactionData.data_transacao || currentDate,
          is_recorrente: false,
        }]);

      if (transacaoError) {
        console.error('Erro ao inserir transação:', transacaoError);
        throw new Error('Erro ao registrar transação');
      }

      responseMessage = `✅ Transação registrada com sucesso! 
📝 ${transactionData.nome_gasto} - ${transactionData.tipo_transacao === 'entrada' ? 'Receita' : 'Gasto'} de R$ ${transactionData.valor_gasto.toFixed(2)}
📂 Categoria: ${transactionData.categoria}
📅 Data: ${new Date(transactionData.data_transacao || currentDate).toLocaleDateString('pt-BR')}`;
    }

    return new Response(JSON.stringify({ message: responseMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ 
      message: `Ops! Houve um erro ao processar sua mensagem: ${error.message}. Tente novamente ou seja mais específico sobre o valor e tipo de transação.` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
