
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

**Campos para cartão de crédito:**
- purchase_date: string (formato YYYY-MM-DD, data da compra)
- total_amount: number (valor total da compra antes de parcelar)
- installments: number (número de parcelas)
- is_subscription: boolean (se é uma assinatura mensal)

**Campos para visualização:**
- type: "transactions" | "recurring" | "summary"
- filter: "gastos" | "receitas" | "entradas" | "recorrentes"

**Campos para exclusão:**
- target_type: "transacao" | "recorrencia" (indica se é para excluir transação ou recorrência)

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

2. "Comprei um celular de 1200 em 6x no crédito"
{
  "action": "create",
  "nome_gasto": "Celular",
  "valor_gasto": 200,
  "tipo_transacao": "gasto",
  "categoria": "Eletrônicos",
  "data_transacao": "${new Date().toISOString().split('T')[0]}",
  "purchase_date": "${new Date().toISOString().split('T')[0]}",
  "total_amount": 1200,
  "installments": 6,
  "is_subscription": false,
  "is_recorrente": false
}

3. "Assinei Netflix por 49.90 no crédito"
{
  "action": "create",
  "nome_gasto": "Netflix",
  "valor_gasto": 49.90,
  "tipo_transacao": "gasto",
  "categoria": "Entretenimento",
  "data_transacao": "${new Date().toISOString().split('T')[0]}",
  "purchase_date": "${new Date().toISOString().split('T')[0]}",
  "total_amount": 49.90,
  "installments": 1,
  "is_subscription": true,
  "is_recorrente": false
}

4. "Parcelei a geladeira em 10x de 150 reais"
{
  "action": "create",
  "nome_gasto": "Geladeira",
  "valor_gasto": 150,
  "tipo_transacao": "gasto",
  "categoria": "Eletrodomésticos",
  "data_transacao": "${new Date().toISOString().split('T')[0]}",
  "purchase_date": "${new Date().toISOString().split('T')[0]}",
  "total_amount": 1500,
  "installments": 10,
  "is_subscription": false,
  "is_recorrente": false
}

5. "Mostrar transações recorrentes"
{
  "action": "view",
  "type": "transactions",
  "filter": "recorrentes"
}

6. "Ver minhas receitas"
{
  "action": "view",
  "type": "transactions", 
  "filter": "receitas"
}

7. "Pago Netflix 25 reais mensalmente"
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

8. "Alterar o valor da gasolina para 80 reais"
{
  "action": "edit",
  "nome_gasto": "Gasolina",
  "valor_gasto": 80
}

9. "Excluir o gasto do cinema"
{
  "action": "delete",
  "nome_gasto": "Cinema",
  "target_type": "transacao"
}

10. "Remover a recorrência do Netflix"
{
  "action": "delete",
  "nome_gasto": "Netflix",
  "target_type": "recorrencia"
}

11. "Deletar minha assinatura do Spotify"
{
  "action": "delete",
  "nome_gasto": "Spotify",
  "target_type": "recorrencia"
}

12. "Apagar o gasto de R$ 50 no mercado"
{
  "action": "delete",
  "nome_gasto": "Mercado",
  "target_type": "transacao"
}

**IMPORTANTE para cartão de crédito:**
- Quando detectar menções de "crédito", "parcelado", "parcelas", "x vezes", "assinatura", sempre inclua os campos de cartão de crédito
- Para compras parceladas, calcule o valor da parcela (total_amount / installments)
- Para assinaturas, marque is_subscription: true e installments: 1
- Sempre inclua purchase_date quando for transação de crédito

**IMPORTANTE para exclusões:** 
- Quando detectar intenção de exclusão/remoção/deletar, sempre use "action": "delete"
- Para exclusões, inclua o target_type para indicar se é "transacao" ou "recorrencia"
- O nome_gasto é obrigatório para identificar qual item excluir
- Palavras-chave de exclusão: "excluir", "remover", "deletar", "apagar", "eliminar"
- Se mencionar "recorrência", "assinatura", "mensalidade", use target_type: "recorrencia"
- Se mencionar "gasto", "compra", "transação", use target_type: "transacao"

**IMPORTANTE para edições:** 
- Quando detectar intenção de edição/alteração/mudança, sempre use "action": "edit"
- Para edições, inclua apenas os campos que devem ser alterados
- O nome_gasto é obrigatório para identificar qual transação editar
- Palavras-chave de edição: "alterar", "mudar", "editar", "atualizar", "modificar", "trocar"

Mensagem do usuário: "${message}"

Retorne APENAS o objeto JSON, sem texto adicional.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
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
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
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
    // URL corrigida da Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
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
      const errorText = await response.text();
      console.error('Gemini API fallback error response:', errorText);
      throw new Error(`Gemini API fallback error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fallback analysis:', error);
    throw error;
  }
}
