
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Transaction {
  id: string;
  nome_gasto: string;
  valor_gasto: number;
  tipo_transacao: 'entrada' | 'gasto';
  categoria: string;
  data_transacao: string;
  created_at: string;
  is_recorrente: boolean;
  recorrencia_id?: string;
}

export interface Recurrence {
  id: string;
  nome_recorrencia: string;
  valor_recorrencia: number;
  tipo_transacao: 'entrada' | 'gasto';
  categoria: string;
  data_inicio: string;
  data_fim?: string;
  frequencia: string;
  created_at: string;
}

export interface TransactionSummary {
  saldoAtual: number;
  totalEntradas: number;
  totalGastos: number;
}

export interface ChartData {
  monthlyComparison: Array<{
    month: string;
    entradas: number;
    gastos: number;
  }>;
  categoryDistribution: Array<{
    categoria: string;
    valor: number;
    color: string;
  }>;
  balanceEvolution: Array<{
    date: string;
    saldo: number;
  }>;
}

const categoryColors = {
  'Alimentação': '#ff6b6b',
  'Transporte': '#4ecdc4',
  'Saúde': '#45b7d1',
  'Educação': '#96ceb4',
  'Lazer': '#feca57',
  'Casa': '#ff9ff3',
  'Trabalho': '#54a0ff',
  'Outros': '#5f27cd'
};

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to check if a recurrence is active for a given month
  const isRecurrenceActive = (recurrence: Recurrence, targetDate: Date): boolean => {
    const startDate = new Date(recurrence.data_inicio);
    const endDate = recurrence.data_fim ? new Date(recurrence.data_fim) : null;
    
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    
    // Check if recurrence started before or during target month
    if (startDate.getFullYear() > targetYear || 
        (startDate.getFullYear() === targetYear && startDate.getMonth() > targetMonth)) {
      return false;
    }
    
    // Check if recurrence ended before target month
    if (endDate && (endDate.getFullYear() < targetYear || 
        (endDate.getFullYear() === targetYear && endDate.getMonth() < targetMonth))) {
      return false;
    }
    
    return true;
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      // Fetch regular transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('data_transacao', { ascending: false });

      if (transactionsError) throw transactionsError;
      
      // Fetch recurrences
      const { data: recurrencesData, error: recurrencesError } = await supabase
        .from('recorrencias')
        .select('*')
        .eq('user_id', user.id)
        .order('data_inicio', { ascending: false });

      if (recurrencesError) throw recurrencesError;
      
      const typedTransactions: Transaction[] = (transactionsData || []).map(transaction => ({
        ...transaction,
        tipo_transacao: transaction.tipo_transacao as 'entrada' | 'gasto'
      }));
      
      const typedRecurrences: Recurrence[] = (recurrencesData || []).map(recurrence => ({
        ...recurrence,
        tipo_transacao: recurrence.tipo_transacao as 'entrada' | 'gasto'
      }));
      
      setTransactions(typedTransactions);
      setRecurrences(typedRecurrences);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar transações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transacoes')
        .insert([
          {
            ...transaction,
            user_id: user.id,
          }
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        const newTransaction: Transaction = {
          ...data[0],
          tipo_transacao: data[0].tipo_transacao as 'entrada' | 'gasto'
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        toast({
          title: "Sucesso",
          description: "Transação adicionada com sucesso!",
        });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar transação",
        variant: "destructive",
      });
    }
  };

  const getTransactionSummary = (): TransactionSummary => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentDate = new Date(currentYear, currentMonth, 1);

    // Filter monthly transactions
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.data_transacao);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    // Calculate totals from regular transactions
    let totalEntradas = monthlyTransactions
      .filter(t => t.tipo_transacao === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor_gasto), 0);

    let totalGastos = monthlyTransactions
      .filter(t => t.tipo_transacao === 'gasto')
      .reduce((sum, t) => sum + Number(t.valor_gasto), 0);

    // Add active recurrences for the current month
    recurrences.forEach(recurrence => {
      if (isRecurrenceActive(recurrence, currentDate)) {
        const valor = Number(recurrence.valor_recorrencia);
        if (recurrence.tipo_transacao === 'entrada') {
          totalEntradas += valor;
        } else {
          totalGastos += valor;
        }
      }
    });

    const saldoAtual = totalEntradas - totalGastos;

    return {
      saldoAtual,
      totalEntradas,
      totalGastos
    };
  };

  const getChartData = (): ChartData => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                       'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Monthly comparison data (last 12 months)
    const monthlyComparison = [];
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.data_transacao);
        return tDate.getMonth() === month && tDate.getFullYear() === year;
      });
      
      let entradas = monthTransactions
        .filter(t => t.tipo_transacao === 'entrada')
        .reduce((sum, t) => sum + Number(t.valor_gasto), 0);
      
      let gastos = monthTransactions
        .filter(t => t.tipo_transacao === 'gasto')
        .reduce((sum, t) => sum + Number(t.valor_gasto), 0);
      
      // Add recurrences for this month
      recurrences.forEach(recurrence => {
        if (isRecurrenceActive(recurrence, targetDate)) {
          const valor = Number(recurrence.valor_recorrencia);
          if (recurrence.tipo_transacao === 'entrada') {
            entradas += valor;
          } else {
            gastos += valor;
          }
        }
      });
      
      monthlyComparison.push({
        month: monthNames[month],
        entradas,
        gastos
      });
    }

    // Category distribution (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentDate = new Date(currentYear, currentMonth, 1);
    
    const categoryTotals: Record<string, number> = {};
    
    // Add regular transactions
    transactions
      .filter(t => {
        const tDate = new Date(t.data_transacao);
        return tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear &&
               t.tipo_transacao === 'gasto';
      })
      .forEach(t => {
        categoryTotals[t.categoria] = (categoryTotals[t.categoria] || 0) + Number(t.valor_gasto);
      });
    
    // Add active recurrences
    recurrences
      .filter(r => r.tipo_transacao === 'gasto' && isRecurrenceActive(r, currentDate))
      .forEach(r => {
        categoryTotals[r.categoria] = (categoryTotals[r.categoria] || 0) + Number(r.valor_recorrencia);
      });

    const categoryDistribution = Object.entries(categoryTotals).map(([categoria, valor]) => ({
      categoria,
      valor,
      color: categoryColors[categoria as keyof typeof categoryColors] || categoryColors.Outros
    }));

    // Balance evolution (last 12 months)
    const balanceEvolution = [];
    let cumulativeBalance = 0;
    
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.data_transacao);
        return tDate.getMonth() === month && tDate.getFullYear() === year;
      });
      
      let monthEntradas = monthTransactions
        .filter(t => t.tipo_transacao === 'entrada')
        .reduce((sum, t) => sum + Number(t.valor_gasto), 0);
      
      let monthGastos = monthTransactions
        .filter(t => t.tipo_transacao === 'gasto')
        .reduce((sum, t) => sum + Number(t.valor_gasto), 0);
      
      // Add recurrences for this month
      recurrences.forEach(recurrence => {
        if (isRecurrenceActive(recurrence, targetDate)) {
          const valor = Number(recurrence.valor_recorrencia);
          if (recurrence.tipo_transacao === 'entrada') {
            monthEntradas += valor;
          } else {
            monthGastos += valor;
          }
        }
      });
      
      cumulativeBalance += monthEntradas - monthGastos;
      
      balanceEvolution.push({
        date: monthNames[month],
        saldo: cumulativeBalance
      });
    }

    return {
      monthlyComparison,
      categoryDistribution,
      balanceEvolution
    };
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    recurrences,
    loading,
    addTransaction,
    getTransactionSummary,
    getChartData,
    refetch: fetchTransactions,
  };
};
