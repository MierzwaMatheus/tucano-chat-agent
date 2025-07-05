
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

export interface TransactionSummary {
  saldoAtual: number;
  totalEntradas: number;
  totalGastos: number;
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('data_transacao', { ascending: false });

      if (error) throw error;
      
      // Garantir que os tipos estão corretos ao definir o estado
      const typedTransactions: Transaction[] = (data || []).map(transaction => ({
        ...transaction,
        tipo_transacao: transaction.tipo_transacao as 'entrada' | 'gasto'
      }));
      
      setTransactions(typedTransactions);
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

    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.data_transacao);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const totalEntradas = monthlyTransactions
      .filter(t => t.tipo_transacao === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor_gasto), 0);

    const totalGastos = monthlyTransactions
      .filter(t => t.tipo_transacao === 'gasto')
      .reduce((sum, t) => sum + Number(t.valor_gasto), 0);

    const saldoAtual = totalEntradas - totalGastos;

    return {
      saldoAtual,
      totalEntradas,
      totalGastos
    };
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  return {
    transactions,
    loading,
    addTransaction,
    getTransactionSummary,
    refetch: fetchTransactions,
  };
};
