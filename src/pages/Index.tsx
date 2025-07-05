import React, { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Dashboard } from '@/components/Dashboard';
import { TransactionsList } from '@/components/TransactionsList';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard' | 'transactions'>('chat');

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
