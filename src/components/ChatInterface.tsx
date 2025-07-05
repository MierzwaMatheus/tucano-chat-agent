import React, { useState, useRef, useEffect } from 'react';
import { Send, User, LogOut, Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTransactions } from '@/hooks/useTransactions';
import { useChatMemory } from '@/hooks/useChatMemory';

export const ChatInterface = () => {
  const { messages, isLoading: loadingMessages, saveMessage, addMessages } = useChatMemory();
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { refetch } = useTransactions();
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mensagem de boas-vindas inicial
  const welcomeMessage = `Olá! Eu sou o Tucano Agent, seu assistente financeiro pessoal. Posso ajudá-lo a:

💰 **Registrar transações:** "Gastei 50 reais no mercado" ou "Recebo 3000 de salário mensalmente"

📊 **Ver suas finanças:** "Mostrar meus gastos", "Ver receitas deste mês", "Quais minhas transações recorrentes?"

✏️ **Editar transações:** "Alterar o valor do mercado para 60 reais"

🗑️ **Excluir transações:** "Remover o gasto do cinema"

Como posso ajudá-lo hoje?`;

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const currentInput = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-chat-input', {
        body: { message: currentInput }
      });

      if (error) {
        throw error;
      }

      const assistantResponse = data.message || 'Mensagem processada com sucesso!';
      
      // Adicionar mensagens localmente para feedback imediato
      addMessages(currentInput, assistantResponse);
      
      // Salvar no banco de dados
      await saveMessage(currentInput, assistantResponse);
      
      // Atualizar lista de transações após qualquer operação
      setTimeout(() => {
        refetch();
      }, 500);

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      const errorMessage = 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente ou seja mais específico sobre valores e tipos de transação.';
      
      addMessages(currentInput, errorMessage);
      await saveMessage(currentInput, errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background backdrop-blur-sm border-b border-tucano-500/30">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-tucano-600 rounded-full flex items-center justify-center">
              <Sparkles className="text-tucano-100 h-4 w-4" />
            </div>
            <div>
              <h2 className="text-foreground font-medium">Tucano Agent</h2>
              <p className="text-sm text-muted-foreground">Seu assistente financeiro inteligente</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.email?.split('@')[0]}</span>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-tucano-400 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-tucano-400 animate-pulse delay-75"></div>
              <div className="w-2 h-2 rounded-full bg-tucano-400 animate-pulse delay-150"></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-12 w-12 text-tucano-400 mb-4" />
            <div className="max-w-[80%] p-3 rounded-2xl bg-tucano-700/60 text-tucano-100 rounded-tl-none border border-tucano-600/50">
              <p className="text-sm whitespace-pre-line">{welcomeMessage}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.isUser
                      ? "bg-tucano-600 text-white rounded-tr-none"
                      : "bg-tucano-700/60 text-tucano-100 rounded-tl-none border border-tucano-600/50"
                  } animate-fade-in`}
                >
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  <p className={`text-xs mt-1 ${msg.isUser ? "text-tucano-200" : "text-tucano-400"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl bg-tucano-700/60 text-tucano-100 rounded-tl-none border border-tucano-600/50">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-tucano-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-tucano-400 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-tucano-400 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input form */}
      <div className="sticky bottom-0 border-t border-tucano-500/30 bg-background/80 backdrop-blur-sm">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Digite sua mensagem... Ex: 'Gastei 25 no almoço', 'Mostrar meus gastos'"
              className="w-full bg-muted/50 border border-tucano-600/50 rounded-full py-3 pl-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tucano-500/70"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className={`absolute right-1 rounded-full p-2 ${
                !inputValue.trim() || isProcessing
                  ? "text-muted-foreground bg-muted/50 cursor-not-allowed"
                  : "text-white bg-tucano-600 hover:bg-tucano-500"
              } transition-colors`}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        .delay-75 {
          animation-delay: 0.2s;
        }
        
        .delay-150 {
          animation-delay: 0.4s;
        }
        `}
      </style>
    </div>
  );
};
