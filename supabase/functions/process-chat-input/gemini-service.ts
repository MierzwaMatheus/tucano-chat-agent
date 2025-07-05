
export async function analyzeUserMessage(message: string, geminiApiKey: string): Promise<any> {
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

  return await geminiResponse.json();
}

export async function fallbackAnalysis(message: string, geminiApiKey: string): Promise<any> {
  const currentDate = new Date().toISOString().split('T')[0];
  
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

  if (!fallbackResponse.ok) {
    return null;
  }

  return await fallbackResponse.json();
}
