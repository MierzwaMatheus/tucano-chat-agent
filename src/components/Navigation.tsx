
import React from 'react';
import { MessageCircle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  activeTab: 'chat' | 'dashboard';
  onTabChange: (tab: 'chat' | 'dashboard') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="glass-strong sticky bottom-0 p-4 border-t border-white/20">
      <div className="flex justify-center space-x-2">
        <Button
          onClick={() => onTabChange('chat')}
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          className={`flex-1 rounded-2xl py-3 flex items-center justify-center space-x-2 transition-all duration-200 ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-tucano-500 to-tucano-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Chat</span>
        </Button>
        
        <Button
          onClick={() => onTabChange('dashboard')}
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          className={`flex-1 rounded-2xl py-3 flex items-center justify-center space-x-2 transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-tucano-500 to-tucano-600 text-white shadow-lg'
              : 'text-gray-600 hover:bg-white/50'
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="font-medium">Dashboard</span>
        </Button>
      </div>
    </nav>
  );
};
