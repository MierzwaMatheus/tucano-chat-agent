
import React from 'react';
import { MessageCircle, BarChart3, Receipt, CreditCard, Settings } from 'lucide-react';

interface NavigationProps {
  activeTab: 'chat' | 'dashboard' | 'transactions' | 'credit' | 'settings';
  onTabChange: (tab: 'chat' | 'dashboard' | 'transactions' | 'credit' | 'settings') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { id: 'dashboard' as const, label: 'Dashboard', icon: BarChart3 },
    { id: 'transactions' as const, label: 'Transações', icon: Receipt },
    { id: 'credit' as const, label: 'Crédito', icon: CreditCard },
    { id: 'settings' as const, label: 'Config', icon: Settings },
  ];

  return (
    <nav className="bg-gray-900 border-t border-gray-800">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'text-tucano-500 bg-tucano-500/10'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <tab.icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
