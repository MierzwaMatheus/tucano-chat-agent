# 🤖 Tucano Agent

<div align="center">
  <img src="https://i.postimg.cc/kMLz6myM/img0.png" alt="Tucano Agent" width="800"/>
  
  <p><em>Seu assistente financeiro pessoal com inteligência artificial</em></p>
  
  [![Licença MIT](https://img.shields.io/badge/Licença-MIT-blue.svg)](LICENSE)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-3ECF8E.svg?logo=supabase)](https://supabase.com/)
  [![Vite](https://img.shields.io/badge/Vite-4.x-646CFF.svg?logo=vite)](https://vitejs.dev/)
  [![Gemini AI](https://img.shields.io/badge/Gemini%20AI-4285F4.svg?logo=google)](https://ai.google.dev/)
</div>

---

## 🌟 Visão Geral

**Tucano Agent** é uma aplicação revolucionária que transforma o gerenciamento financeiro através de **inteligência artificial**. Converse com seu assistente pessoal e gerencie suas finanças de forma natural e intuitiva.

### 🎯 Principais Diferenciais

- 🤖 **Chat com IA**: Gerencie transações conversando em linguagem natural
- 📊 **Dashboard Inteligente**: Visualize suas finanças com gráficos avançados
- 🔄 **Transações Recorrentes**: Controle automático de assinaturas e gastos fixos
- 📱 **Mobile First**: Interface responsiva otimizada para dispositivos móveis
- 🎨 **Design Moderno**: UI elegante com glassmorphism e tema dark

---

## 🚀 Demonstração

### 💬 Como Funciona o Chat com IA

```
Você: "Gastei 50 reais no mercado hoje"
Tucano Agent: ✅ Transação registrada! Gasto de R$ 50,00 no mercado, categoria Alimentação.

Você: "Mostrar meus gastos deste mês"
Tucano Agent: 📊 Aqui estão seus gastos de dezembro:
• Mercado: R$ 350,00
• Gasolina: R$ 200,00
• Netflix: R$ 25,00
Total: R$ 575,00

Você: "Alterar o valor da gasolina para 180 reais"
Tucano Agent: ✏️ Valor da gasolina alterado para R$ 180,00!
```

---

## ✨ Funcionalidades Completas

### 🤖 Assistente com IA (Gemini)

- Registro de transações por texto: _"Paguei 100 reais na farmácia"_
- Consulta de dados: _"Quanto gastei em alimentação?"_
- Edição de transações: _"Alterar categoria do uber para transporte"_
- Exclusão inteligente: _"Remover o gasto do cinema"_
- Gerenciamento de recorrências: _"Pago Netflix 25 reais mensalmente"_

### 📊 Dashboard Avançado

- **Evolução do Saldo**: Gráfico linear mostrando crescimento/declínio
- **Distribuição por Categoria**: Pizza chart com gastos por categoria
- **Comparação Mensal**: Barras comparativas entre meses
- **Tendências de Categoria**: Análise temporal por categoria
- **Transações Diárias**: Distribuição de gastos por dia do mês
- **Controle de Recorrências**: Visualização de gastos fixos

### 💰 Gestão Financeira

- Controle de receitas e despesas
- Categorização automática inteligente
- Transações recorrentes com frequência configurável
- Histórico completo de transações
- Resumo financeiro em tempo real

---

## 🎨 Interface do Usuário

### 📱 Navegação Principal

| Seção             | Descrição                                     |
| ----------------- | --------------------------------------------- |
| 🤖 **Chat**       | Interface de conversação com o assistente IA  |
| 📊 **Dashboard**  | Visualização avançada com gráficos e análises |
| 📋 **Transações** | Lista detalhada de todas as transações        |

### 🎭 Componentes Visuais

- **Glassmorphism**: Efeito de vidro translúcido moderno
- **Gradientes**: Paleta de cores roxo/violeta (Tucano brand)
- **Micro-interações**: Animações suaves e responsivas
- **Cards Inteligentes**: Organização visual intuitiva

---

## 🛠️ Tecnologias Utilizadas

### 🏗️ Frontend

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### 🔧 Backend & Serviços

- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Service**: [Google Gemini API](https://ai.google.dev/)
- **Edge Functions**: Supabase Functions (Deno)
- **Real-time**: Supabase Realtime

### 🎯 Arquitetura

- **State Management**: React Hooks + TanStack Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner Toast

---

## 🚀 Instalação e Desenvolvimento

### 📋 Pré-requisitos

```bash
# Node.js 18+ e npm
node -v  # v18.0.0+
npm -v   # 9.0.0+
```

### 🔧 Configuração do Projeto

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/tucano-agent.git
cd tucano-agent

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local

# 4. Configure o Supabase
# Adicione suas chaves do Supabase no .env.local
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui

# 5. Configure a API do Gemini
# Adicione sua chave da API do Gemini no Supabase
GEMINI_API_KEY=sua_chave_gemini_aqui

# 6. Execute as migrações do banco
npx supabase db push

# 7. Inicie o servidor de desenvolvimento
npm run dev
```

### 🐳 Docker (Opcional)

```bash
# Construir e executar com Docker
docker-compose up --build

# Acessar em http://localhost:8080
```

---

## 📊 Estrutura do Banco de Dados

### 🏗️ Tabelas Principais

```sql
-- Transações do usuário
CREATE TABLE transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  nome_gasto TEXT NOT NULL,
  valor_gasto DECIMAL(10,2) NOT NULL,
  tipo_transacao TEXT CHECK (tipo_transacao IN ('entrada', 'gasto')),
  categoria TEXT NOT NULL,
  data_transacao DATE NOT NULL,
  is_recorrente BOOLEAN DEFAULT false,
  recorrencia_id UUID REFERENCES recorrencias(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recorrências (assinaturas, salários, etc.)
CREATE TABLE recorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  nome_recorrencia TEXT NOT NULL,
  valor_recorrencia DECIMAL(10,2) NOT NULL,
  tipo_transacao TEXT CHECK (tipo_transacao IN ('entrada', 'gasto')),
  categoria TEXT NOT NULL,
  frequencia TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memória do chat (contexto da conversa)
CREATE TABLE chat_memory (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_message TEXT,
  assistant_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🤖 Como Usar o Chat com IA

### 💬 Comandos Básicos

#### ➕ Adicionar Transações

```
"Gastei 35 reais no almoço"
"Recebi 3000 de salário"
"Paguei 150 reais na conta de luz"
"Comprei remédio por 45 reais"
```

#### 📊 Consultar Dados

```
"Mostrar meus gastos"
"Ver receitas deste mês"
"Quais são minhas transações recorrentes?"
"Quanto gastei em alimentação?"
```

#### ✏️ Editar Transações

```
"Alterar o valor do mercado para 60 reais"
"Mudar a categoria do uber para transporte"
"Atualizar a data da farmácia para ontem"
```

#### 🗑️ Remover Transações

```
"Excluir o gasto do cinema"
"Remover a compra da livraria"
"Deletar a assinatura do Spotify"
```

#### 🔄 Transações Recorrentes

```
"Pago Netflix 29 reais mensalmente"
"Recebo 3500 de salário todo mês"
"Gasto 200 reais semanalmente no mercado"
"Pago academia 80 reais mensalmente"
```

---

## 🎨 Personalização

### 🎭 Temas e Cores

```typescript
// Paleta de cores do Tucano
const tucanoColors = {
	50: '#f5f3ff',
	100: '#ede8ff',
	200: '#ddd6fe',
	300: '#c4b5fd',
	400: '#a78bfa',
	500: '#8b5cf6', // Cor principal
	600: '#7c3aed',
	700: '#6d28d9',
	800: '#5b21b6',
	900: '#4c1d95',
	950: '#2e1065',
}
```

### 🎯 Categorias Personalizadas

```typescript
const categoryColors = {
	Salário: '#8b5cf6',
	Alimentação: '#a78bfa',
	Transporte: '#c4b5fd',
	Entretenimento: '#ddd6fe',
	Saúde: '#34D399',
	Educação: '#60A5FA',
	// Adicione suas categorias
}
```

---

## 🔧 Configuração Avançada

### 🚀 Deploy

#### Vercel (Recomendado)

```bash
# 1. Instale a CLI da Vercel
npm i -g vercel

# 2. Faça o deploy
vercel --prod

# 3. Configure as variáveis de ambiente no painel da Vercel
```

#### Netlify

```bash
# 1. Build do projeto
npm run build

# 2. Deploy da pasta dist/
# Configure as variáveis de ambiente no painel do Netlify
```

### 🔐 Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica

# Gemini AI (Configure no Supabase Functions)
GEMINI_API_KEY=sua_chave_do_gemini

# Supabase Service Role (para Edge Functions)
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
```

---

## 🧪 Roadmap

### 🎯 Próximas Funcionalidades

- [ ] 📸 **Reconhecimento de Imagem**: Tire foto de recibos e adicione automaticamente
- [ ] 🎯 **Metas Financeiras**: Defina e acompanhe objetivos de gastos
- [ ] 📱 **App Mobile Nativo**: Versão React Native
- [ ] 🔔 **Notificações Push**: Alertas de gastos e lembretes
- [ ] 📊 **Relatórios Avançados**: Exportação para PDF/Excel
- [ ] 🤝 **Compartilhamento**: Finanças compartilhadas (casal/família)
- [ ] 🏦 **Integração Bancária**: Sincronização automática com bancos
- [ ] 💰 **Investimentos**: Controle de carteira de investimentos
- [ ] 📈 **Previsões**: IA preditiva para gastos futuros
- [ ] 🌍 **Multi-idioma**: Suporte para inglês e espanhol

### 🚀 Melhorias Técnicas

- [ ] 🔄 **Offline Mode**: Funcionalidade offline com sincronização
- [ ] ⚡ **Performance**: Otimizações e lazy loading
- [ ] 🧪 **Testes**: Cobertura de testes automatizados
- [ ] 🛡️ **Segurança**: Criptografia end-to-end
- [ ] 📱 **PWA**: Progressive Web App completa

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Siga estas etapas:

### 🔄 Fluxo de Contribuição

```bash
# 1. Fork o projeto
git fork https://github.com/seu-usuario/tucano-agent

# 2. Crie uma branch para sua feature
git checkout -b feature/nova-funcionalidade

# 3. Commit suas alterações
git commit -m "feat: adiciona nova funcionalidade X"

# 4. Push para a branch
git push origin feature/nova-funcionalidade

# 5. Abra um Pull Request
```

### 📝 Padrões de Commit

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas de build/ci
```

### 🐛 Reportando Bugs

Ao reportar bugs, inclua:

- Descrição clara do problema
- Passos para reproduzir
- Comportamento esperado vs atual
- Screenshots (se aplicável)
- Informações do ambiente

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- [Supabase](https://supabase.com/) pela infraestrutura backend
- [Google Gemini](https://ai.google.dev/) pela inteligência artificial
- [Shadcn/ui](https://ui.shadcn.com/) pelos componentes elegantes
- [Recharts](https://recharts.org/) pelos gráficos interativos
- [Lucide](https://lucide.dev/) pelos ícones modernos

---

## 📬 Contato e Suporte

<div align="center">
  
  ### 🌟 Gostou do projeto? Deixe uma estrela!
  
  <p>Feito com 💜 por desenvolvedores que amam praticidade e inovação financeira</p>
  
  <p>
    <a href="https://github.com/seu-usuario/tucano-agent/issues">🐛 Reportar Bug</a> • 
    <a href="https://github.com/seu-usuario/tucano-agent/issues">💡 Sugerir Melhoria</a> • 
    <a href="https://github.com/seu-usuario/tucano-agent/discussions">💬 Discussões</a>
  </p>
  
  <p>
    <a href="https://twitter.com/tucano_agent">
      <img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter">
    </a>
    <a href="https://discord.gg/tucano">
      <img src="https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white" alt="Discord">
    </a>
    <a href="mailto:contato@tucano-agent.com">
      <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
    </a>
  </p>
  
  <img src="https://contrib.rocks/image?repo=seu-usuario/tucano-agent" alt="Contribuidores" />
  
</div>

---

<div align="center">
  <sub>🤖 Tucano Agent - Transformando o gerenciamento financeiro com inteligência artificial</sub>
</div>
