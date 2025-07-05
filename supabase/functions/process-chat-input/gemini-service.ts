
export async function analyzeUserMessage(message: string, geminiApiKey: string): Promise<any> {
  const prompt = `
Analise a mensagem do usuário e retorne APENAS um objeto JSON plano sem aninhamento. Use EXATAMENTE estes nomes de campos:

**Campos obrigatórios:**
- nome_gasto: string (nome/descrição da transação)
- valor_gasto: number (valor numérico)
- tipo_transacao: "entrada" ou "gasto"
- categoria: string
- data_transacao: string (formato YYYY-MM-DD)
- is_recorrente: boolean
- action: "create" | "view" | "edit" | "delete"

**Campos opcionais para transações recorrentes:**
- frequencia: "diaria" | "semanal" | "mensal" | "anual"
- data_inicio: string (formato YYYY-MM-DD)
- data_fim: string (formato YYYY-MM-DD, opcional)

**Campos para visualização:**
- type: "transactions" | "recurring" | "summary"
- filter: "gastos" | "receitas" | "entradas" | "recorrentes"

**Exemplos de análise:**

1. "Gastei 50 no mercado"
{
  "action": "create",
  "nome_gasto": "Mercado",
  "valor_gasto": 50,
  "tipo_transacao": "gasto",
  "categoria": "Alimentação",
  "data_transacao": "${new Date().toISOString().split('T')[0]}",
  "is_recorrente": false
}

2. "Mostrar transações recorrentes"
{
  "action": "view",
  "type": "transactions",
  "filter": "recorrentes"
}

3. "Ver minhas receitas"
{
  "action": "view",
  "type": "transactions", 
  "filter": "receitas"
}

4. "Pago Netflix 25 reais mensalmente"
{
  "action": "create",
  "nome_gasto": "Netflix",
  "valor_gasto": 25,
  "tipo_transacao": "gasto",
  "categoria": "Entretenimento",
  "data_transacao": "${new Date().toISOString().split('T')[0]}",
  "is_recorrente": true,
  "frequencia": "mensal",
  "data_inicio": "${new Date().toISOString().split('T')[0]}"
}

Mensagem do usuário: "${message}"

Retorne APENAS o objeto JSON, sem texto adicional.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

export async function fallbackAnalysis(message: string, geminiApiKey: string): Promise<any> {
  const prompt = `
Analise esta mensagem financeira e extraia informações de transação. Retorne APENAS um objeto JSON plano:

{
  "nome_gasto": "descrição da transação",
  "valor_gasto": valor_numérico,
  "tipo_transacao": "entrada" ou "gasto",
  "categoria": "categoria apropriada",
  "data_transacao": "YYYY-MM-DD",
  "is_recorrente": false
}

Mensagem: "${message}"`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 1,
          topP: 1,
          maxOutputTokens: 512,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API fallback error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fallback analysis:', error);
    throw error;
  }
}
