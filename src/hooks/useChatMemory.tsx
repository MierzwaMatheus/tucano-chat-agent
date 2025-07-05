
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const useChatMemory = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Carregar mensagens existentes do banco
  const loadMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_memory')
        .select('*')
        .eq('session_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        return;
      }

      const chatMessages: ChatMessage[] = [];
      
      data?.forEach((record) => {
        if (record.user_message) {
          chatMessages.push({
            id: `user-${record.id}`,
            text: record.user_message,
            isUser: true,
            timestamp: new Date(record.created_at || Date.now()),
          });
        }
        
        if (record.assistant_response) {
          chatMessages.push({
            id: `assistant-${record.id}`,
            text: record.assistant_response,
            isUser: false,
            timestamp: new Date(record.created_at || Date.now()),
          });
        }
      });

      setMessages(chatMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar nova mensagem no banco
  const saveMessage = async (userMessage: string, assistantResponse: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_memory')
        .insert([{
          session_id: user.id,
          user_message: userMessage,
          assistant_response: assistantResponse,
        }]);

      if (error) {
        console.error('Erro ao salvar mensagem:', error);
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  // Adicionar mensagens localmente (para feedback imediato)
  const addMessages = (userMessage: string, assistantResponse: string) => {
    const timestamp = new Date();
    
    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: userMessage,
      isUser: true,
      timestamp,
    };

    const newAssistantMessage: ChatMessage = {
      id: `assistant-${Date.now() + 1}`,
      text: assistantResponse,
      isUser: false,
      timestamp,
    };

    setMessages(prev => [...prev, newUserMessage, newAssistantMessage]);
  };

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  return {
    messages,
    isLoading,
    saveMessage,
    addMessages,
    loadMessages,
  };
};
