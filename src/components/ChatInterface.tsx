
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTransactions } from '@/hooks/useTransactions';
import { useChatMemory } from '@/hooks/useChatMemory';

export const ChatInterface = () => {
  const { messages, isLoading: loadingMessages, saveMessage, addMessages } = useChatMemory();
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { refetch } = useTransactions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-10 p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-tucano-500 to-tucano-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Tucano Agent</h1>
              <p className="text-sm text-gray-600">Seu assistente financeiro inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>{user?.email?.split('@')[0]}</span>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-32">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-tucano-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-tucano-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-tucano-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : (
          <>
            {/* Mensagem de boas-vindas se não houver mensagens */}
            {messages.length === 0 && (
              <div className="flex justify-start animate-fadeIn">
                <div className="glass bg-white/70 text-gray-800 max-w-xs sm:max-w-md px-4 py-3 rounded-2xl">
                  <p className="text-sm leading-relaxed whitespace-pre-line">{welcomeMessage}</p>
                  <p className="text-xs mt-1 text-gray-500">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-gradient-to-r from-tucano-500 to-tucano-600 text-white'
                      : 'glass bg-white/70 text-gray-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isUser ? 'text-tucano-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
        
        {isProcessing && (
          <div className="flex justify-start animate-fadeIn">
            <div className="glass bg-white/70 text-gray-800 max-w-xs sm:max-w-md px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-tucano-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-tucano-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-tucano-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Analisando sua solicitação...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-strong sticky bottom-0 p-4 border-t border-white/20">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem... Ex: 'Gastei 25 no almoço', 'Mostrar meus gastos', 'Ver receitas deste mês'"
              rows={1}
              className="w-full resize-none rounded-2xl border border-white/20 bg-white/50 backdrop-blur-sm px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-tucano-500 focus:border-transparent placeholder-gray-500"
              style={{ maxHeight: '120px' }}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="bg-gradient-to-r from-tucano-500 to-tucano-600 hover:from-tucano-600 hover:to-tucano-700 text-white rounded-2xl p-3 transition-all duration-200 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
