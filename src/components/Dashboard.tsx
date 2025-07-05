
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinancialCard {
  title: string;
  value: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon: React.ReactNode;
  gradient: string;
}

export const Dashboard = () => {
  const financialData: FinancialCard[] = [
    {
      title: 'Saldo Atual',
      value: 'R$ 4.250,80',
      trend: 'up',
      trendValue: '+5.2%',
      icon: <DollarSign className="h-6 w-6" />,
      gradient: 'from-tucano-500 to-tucano-600'
    },
    {
      title: 'Entradas (Mês)',
      value: 'R$ 3.500,00',
      trend: 'up',
      trendValue: '+12.5%',
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-tucano-emerald-500 to-tucano-emerald-600'
    },
    {
      title: 'Gastos (Mês)',
      value: 'R$ 2.180,45',
      trend: 'down',
      trendValue: '-3.1%',
      icon: <TrendingDown className="h-6 w-6" />,
      gradient: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="font-bitter font-bold text-2xl text-gray-800 mb-2">
          Dashboard Financeiro
        </h2>
        <p className="text-gray-600">Acompanhe suas finanças em tempo real</p>
      </div>

      {/* Financial Cards */}
      <div className="space-y-4">
        {financialData.map((item, index) => (
          <div
            key={item.title}
            className="glass p-6 rounded-2xl shadow-lg animate-scale-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${item.gradient} text-white`}>
                {item.icon}
              </div>
              {item.trend && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  item.trend === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{item.trendValue}</span>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-1">{item.title}</p>
              <p className="font-bitter font-bold text-2xl text-gray-800">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass p-6 rounded-2xl shadow-lg animate-fade-in">
        <h3 className="font-bitter font-semibold text-lg text-gray-800 mb-4">
          Ações Rápidas
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-gradient-to-r from-tucano-500 to-tucano-600 hover:from-tucano-600 hover:to-tucano-700 text-white rounded-xl p-4 h-auto flex flex-col items-center space-y-2">
            <Plus className="h-5 w-5" />
            <span className="text-sm">Adicionar Receita</span>
          </Button>
          
          <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl p-4 h-auto flex flex-col items-center space-y-2">
            <Plus className="h-5 w-5" />
            <span className="text-sm">Registrar Gasto</span>
          </Button>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          className="bg-gradient-to-r from-tucano-500 to-tucano-600 hover:from-tucano-600 hover:to-tucano-700 text-white rounded-full w-14 h-14 shadow-2xl transform transition-all duration-200 hover:scale-110 animate-scale-in"
          style={{ animationDelay: '800ms' }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
