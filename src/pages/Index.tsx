
import React, { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Dashboard } from '@/components/Dashboard';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-tucano-50 via-white to-tucano-100">
      <div className="flex flex-col h-screen">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' ? (
            <ChatInterface />
          ) : (
            <div className="h-full overflow-y-auto">
              <Dashboard />
            </div>
          )}
        </div>

        {/* Navigation */}
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
