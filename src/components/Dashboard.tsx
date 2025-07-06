import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BentoGrid } from '@/components/ui/bento-grid';
import { useTransactions } from '@/hooks/useTransactions';
import { AddTransactionModal } from './AddTransactionModal';
import { MonthlyComparisonChart } from './charts/MonthlyComparisonChart';
import { CategoryDistributionChart } from './charts/CategoryDistributionChart';
import { BalanceEvolutionChart } from './charts/BalanceEvolutionChart';
import { CategoryTrendChart } from './charts/CategoryTrendChart';
import { DailyTransactionChart } from './charts/DailyTransactionChart';
import { RecurringTransactionsChart } from './charts/RecurringTransactionsChart';
import { CreditCardSummary } from './CreditCardSummary';

export const Dashboard = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const { getTransactionSummary, getChartData, loading } = useTransactions();
  
  const { saldoAtual, totalEntradas, totalGastos } = getTransactionSummary();
  const chartData = getChartData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleViewCreditDetails = () => {
    // Esta função pode ser implementada para navegar para a aba de crédito
    console.log('Navegar para detalhes do cartão');
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-950">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
      </div>

      {/* Bento Grid Summary Cards */}
      <BentoGrid className="lg:grid-rows-3 auto-rows-[16rem] md:auto-rows-[18rem]">
        {/* Saldo Atual - Card principal */}
        <Card className="lg:row-start-1 lg:row-end-3 lg:col-start-1 lg:col-end-3 glass border-white/20 backdrop-blur-lg bg-gray-900/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-white">
              Saldo Atual
            </CardTitle>
            <DollarSign className="h-8 w-8 text-gray-300" />
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-full">
            <div className={`text-4xl md:text-5xl font-bold mb-2 ${saldoAtual >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(saldoAtual)}
            </div>
            <p className="text-sm text-gray-300">
              Inclui transações recorrentes
            </p>
          </CardContent>
        </Card>

        {/* Total de Entradas */}
        <Card className="lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2 glass border-white/20 backdrop-blur-lg bg-gray-900/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total de Entradas (Mês)
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(totalEntradas)}
            </div>
            <p className="text-xs text-gray-300">
              Receitas + recorrências do mês
            </p>
          </CardContent>
        </Card>

        {/* Total de Gastos */}
        <Card className="lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-3 glass border-white/20 backdrop-blur-lg bg-gray-900/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">
              Total de Gastos (Mês)
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(totalGastos)}
            </div>
            <p className="text-xs text-gray-300">
              Despesas + recorrências do mês
            </p>
          </CardContent>
        </Card>

        {/* Resumo do Cartão de Crédito */}
        <div className="lg:col-start-1 lg:col-end-4 lg:row-start-3 lg:row-end-4">
          <CreditCardSummary onViewDetails={handleViewCreditDetails} />
        </div>
      </BentoGrid>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Monthly Comparison Chart */}
        <MonthlyComparisonChart data={chartData.monthlyComparison} />
        
        {/* Category and Balance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryDistributionChart data={chartData.categoryDistribution} />
          <BalanceEvolutionChart data={chartData.balanceEvolution} />
        </div>

        {/* New Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryTrendChart data={chartData.categoryTrend} />
          <DailyTransactionChart data={chartData.dailyTransactions} />
        </div>

        {/* Recurring Transactions Chart */}
        <RecurringTransactionsChart data={chartData.recurringTransactions} />
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
