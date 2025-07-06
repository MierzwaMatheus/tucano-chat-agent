
import React, { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Dashboard } from '@/components/Dashboard';
import { TransactionsList } from '@/components/TransactionsList';
import { Navigation } from '@/components/Navigation';
import CreditCardPage from '@/pages/CreditCard';
import Settings from '@/pages/Settings';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'transactions' | 'credit' | 'settings'>('chat');

  // Escutar evento de navegação para crédito
  useEffect(() => {
    const handleNavigateToCredit = () => {
      setActiveTab('credit');
    };

    window.addEventListener('navigate-to-credit', handleNavigateToCredit);
    
    return () => {
      window.removeEventListener('navigate-to-credit', handleNavigateToCredit);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface />;
      case 'dashboard':
        return (
          <div className="h-full overflow-y-auto">
            <Dashboard />
          </div>
        );
      case 'transactions':
        return (
          <div className="h-full overflow-y-auto">
            <TransactionsList />
          </div>
        );
      case 'credit':
        return (
          <div className="h-full overflow-y-auto">
            <CreditCardPage />
          </div>
        );
      case 'settings':
        return (
          <div className="h-full overflow-y-auto">
            <Settings />
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
