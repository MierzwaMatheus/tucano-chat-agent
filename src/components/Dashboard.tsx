
import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { AddTransactionModal } from './AddTransactionModal';

export const Dashboard = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { getTransactionSummary, loading } = useTransactions();
  
  const { saldoAtual, totalEntradas, totalGastos } = getTransactionSummary();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Financeiro</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/20 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Saldo Atual
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoAtual)}
            </div>
            <p className="text-xs text-gray-500">
              Diferença entre entradas e gastos
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-white/20 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Entradas (Mês)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalEntradas)}
            </div>
            <p className="text-xs text-gray-500">
              Receitas do mês atual
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-white/20 backdrop-blur-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Gastos (Mês)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalGastos)}
            </div>
            <p className="text-xs text-gray-500">
              Despesas do mês atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-tucano-500 to-tucano-600 hover:from-tucano-600 hover:to-tucano-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 z-10"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Transaction Modal */}
      <AddTransactionModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </div>
  );
};
