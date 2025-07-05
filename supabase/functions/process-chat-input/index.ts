
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './types.ts';
import { normalizeTransactionData } from './data-normalizer.ts';
import { analyzeUserMessage } from './gemini-service.ts';
import { createTransaction, editTransaction, deleteTransaction, viewTransactions, handleFallbackTransaction } from './transaction-handler.ts';

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

    const geminiData = await analyzeUserMessage(message, geminiApiKey);
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
        responseMessage = await createTransaction(analysis, supabase, user.id);
        break;

      case 'view':
        responseMessage = await viewTransactions(analysis, supabase, user.id);
        break;

      case 'edit':
        responseMessage = await editTransaction(analysis, supabase, user.id);
        break;

      case 'delete':
        responseMessage = await deleteTransaction(analysis, supabase, user.id);
        break;

      default:
        // Fallback melhorado - tentar processar como transação diretamente
        const fallbackResult = await handleFallbackTransaction(message, supabase, user.id, geminiApiKey);
        
        if (fallbackResult) {
          responseMessage = fallbackResult;
        } else {
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
