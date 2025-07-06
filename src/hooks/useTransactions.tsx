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
  categoryTrend: Array<{
    date: string;
    [key: string]: number | string;
  }>;
  dailyTransactions: Array<{
    dia: number;
    entradas: number;
    saidas: number;
  }>;
  recurringTransactions: Array<{
    nome: string;
    frequencia: number;
    valor: number;
  }>;
}

const categoryColors = {
  'Salário': '#8b5cf6', // tucano-500
  'Freelancer': '#7c3aed', // tucano-600
  'Venda': '#6d28d9', // tucano-700
  'Presentes': '#5b21b6', // tucano-800
  'Casa': '#a78bfa', // tucano-400
  'Comida': '#c4b5fd', // tucano-300
  'Assinatura': '#ddd6fe', // tucano-200
  'Diversão': '#ede8ff', // tucano-100
  'Outros': '#6B7280', // cinza neutro
};

// Cores do projeto para gráficos
const projectColors = {
  primary: '#8b5cf6', // tucano-500
  secondary: '#7c3aed', // tucano-600
  accent1: '#6d28d9', // tucano-700
  accent2: '#5b21b6', // tucano-800
  light1: '#a78bfa', // tucano-400
  light2: '#c4b5fd', // tucano-300
  light3: '#ddd6fe', // tucano-200
  neutral: '#6B7280', // cinza neutro
  background: 'rgba(17, 24, 39, 0.95)', // fundo escuro
  grid: 'rgba(255,255,255,0.1)', // grade dos gráficos
  text: '#E5E7EB', // texto claro
  success: '#34D399', // verde para valores positivos
  danger: '#EF4444', // vermelho para valores negativos
};

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Helper function to check if a recurrence should be included for current month only
  const isRecurrenceActiveForCurrentMonth = (recurrence: Recurrence): boolean => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startDate = new Date(recurrence.data_inicio);
    const endDate = recurrence.data_fim ? new Date(recurrence.data_fim) : null;
    
    // Check if recurrence started before or during current month
    if (startDate.getFullYear() > currentYear || 
        (startDate.getFullYear() === currentYear && startDate.getMonth() > currentMonth)) {
      return false;
    }
    
    // Check if recurrence ended before current month
    if (endDate && (endDate.getFullYear() < currentYear || 
        (endDate.getFullYear() === currentYear && endDate.getMonth() < currentMonth))) {
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

    // Add active recurrences for the current month only
    recurrences.forEach(recurrence => {
      if (isRecurrenceActiveForCurrentMonth(recurrence)) {
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
      
      // Add recurrences only if they were active during that specific month
      recurrences.forEach(recurrence => {
        const startDate = new Date(recurrence.data_inicio);
        const endDate = recurrence.data_fim ? new Date(recurrence.data_fim) : null;
        
        // Check if recurrence was active during the target month
        if (startDate.getFullYear() <= year && 
            (startDate.getFullYear() < year || startDate.getMonth() <= month)) {
          if (!endDate || (endDate.getFullYear() >= year && 
              (endDate.getFullYear() > year || endDate.getMonth() >= month))) {
            const valor = Number(recurrence.valor_recorrencia);
            if (recurrence.tipo_transacao === 'entrada') {
              entradas += valor;
            } else {
              gastos += valor;
            }
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
      .filter(r => r.tipo_transacao === 'gasto' && isRecurrenceActiveForCurrentMonth(r))
      .forEach(r => {
        categoryTotals[r.categoria] = (categoryTotals[r.categoria] || 0) + Number(r.valor_recorrencia);
      });

    const categoryDistribution = Object.entries(categoryTotals).map(([categoria, valor]) => ({
      categoria,
      valor,
      color: categoryColors[categoria as keyof typeof categoryColors] || projectColors.neutral,
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
        const startDate = new Date(recurrence.data_inicio);
        const endDate = recurrence.data_fim ? new Date(recurrence.data_fim) : null;
        const recurrenceYear = startDate.getFullYear();
        const recurrenceMonth = startDate.getMonth();

        if (recurrenceYear <= year && recurrenceMonth <= month) {
            if (!endDate || (endDate.getFullYear() >= year && endDate.getMonth() >= month)) {
              const valor = Number(recurrence.valor_recorrencia);
              if (recurrence.tipo_transacao === 'entrada') {
                monthEntradas += valor;
              } else {
                monthGastos += valor;
              }
            }
        }
      });
      
      cumulativeBalance += monthEntradas - monthGastos;
      
      balanceEvolution.push({
        date: monthNames[month],
        saldo: cumulativeBalance
      });
    }

    // Prepare data for category trend chart
    const categoryTrend = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.data_transacao).toISOString().split('T')[0];
      const valor = transaction.tipo_transacao === 'gasto' ? Number(transaction.valor_gasto) : 0;
      
      const existingDate = acc.find(item => item.date === date);
      if (existingDate) {
        existingDate[transaction.categoria] = (Number(existingDate[transaction.categoria]) || 0) + valor;
      } else {
        acc.push({
          date,
          [transaction.categoria]: valor,
        });
      }
      return acc;
    }, [] as Array<{ date: string; [key: string]: number | string }>)
    .sort((a, b) => a.date.localeCompare(b.date));

    // Prepare data for daily transactions chart
    const dailyTransactions = transactions.reduce((acc, transaction) => {
      const dia = new Date(transaction.data_transacao).getDate();
      const valor = Number(transaction.valor_gasto);
      
      const existingDay = acc.find(item => item.dia === dia);
      if (existingDay) {
        if (transaction.tipo_transacao === 'entrada') {
          existingDay.entradas += valor;
        } else {
          existingDay.saidas += valor;
        }
      } else {
        acc.push({
          dia,
          entradas: transaction.tipo_transacao === 'entrada' ? valor : 0,
          saidas: transaction.tipo_transacao === 'gasto' ? valor : 0,
        });
      }
      return acc;
    }, [] as Array<{ dia: number; entradas: number; saidas: number }>)
    .sort((a, b) => a.dia - b.dia);

    // Prepare data for recurring transactions chart
    const recurringTransactions = transactions
      .filter(t => t.is_recorrente)
      .reduce((acc, transaction) => {
        const existingTransaction = acc.find(item => item.nome === transaction.nome_gasto);
        if (existingTransaction) {
          existingTransaction.frequencia += 1;
          existingTransaction.valor = Math.max(existingTransaction.valor, Number(transaction.valor_gasto));
        } else {
          acc.push({
            nome: transaction.nome_gasto,
            frequencia: 1,
            valor: Number(transaction.valor_gasto),
          });
        }
        return acc;
      }, [] as Array<{ nome: string; frequencia: number; valor: number }>)
      .sort((a, b) => b.frequencia - a.frequencia)
      .slice(0, 10); // Top 10 recurring transactions

    return {
      monthlyComparison,
      categoryDistribution,
      balanceEvolution,
      categoryTrend,
      dailyTransactions,
      recurringTransactions,
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
