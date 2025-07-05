
import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Olá! Eu sou o Tucano Agent, seu assistente financeiro pessoal. Como posso te ajudar hoje?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Simular resposta do agente após um breve delay
    setTimeout(() => {
      const responses = [
        "Entendi! Vou analisar sua situação financeira e te dar algumas sugestões.",
        "Ótima pergunta! Com base nos seus dados, posso te ajudar com isso.",
        "Vou processar essas informações e te dar um relatório detalhado.",
        "Perfeito! Deixe-me verificar algumas opções para você."
      ];
      
      const agentResponse: Message = {
        id: messages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentResponse]);
    }, 1000);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-tucano-50 via-white to-tucano-100">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-10 px-4 py-4 flex items-center justify-between animate-fade-in">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-tucano-500 to-tucano-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="font-bitter font-bold text-xl text-gray-800">Tucano Agent</h1>
            <p className="text-sm text-gray-600">Seu assistente financeiro</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.isUser
                  ? 'bg-gradient-to-r from-tucano-500 to-tucano-600 text-white ml-auto'
                  : 'glass text-gray-800 mr-auto'
              } shadow-lg`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p className={`text-xs mt-1 ${message.isUser ? 'text-tucano-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-strong sticky bottom-0 p-4 animate-fade-in">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Converse com o Tucano..."
              className="w-full resize-none rounded-2xl px-4 py-3 pr-12 glass text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tucano-500 focus:border-transparent min-h-[48px] max-h-32"
              rows={1}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-tucano-500 to-tucano-600 hover:from-tucano-600 hover:to-tucano-700 text-white rounded-full p-3 shadow-lg transform transition-all duration-200 hover:scale-105"
            disabled={inputText.trim() === ''}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
