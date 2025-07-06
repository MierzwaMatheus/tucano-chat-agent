
import { useState, useMemo } from 'react';

export interface NormalizedTransaction {
  id: string;
  nome_gasto: string;
  valor_gasto: number;
  tipo_transacao: 'entrada' | 'gasto';
  categoria: string;
  data_transacao: string;
  isRecurrent: boolean;
  created_at: string;
  is_paid?: boolean;
}

export interface TransactionFilters {
  searchTerm: string;
  selectedCategories: string[];
  paymentStatus?: 'all' | 'paid' | 'unpaid';
}

export const useTransactionFilters = (transactions: NormalizedTransaction[]) => {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchTerm: '',
    selectedCategories: [],
    paymentStatus: 'all'
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = filters.searchTerm === '' || 
        transaction.nome_gasto.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        transaction.categoria.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesCategory = filters.selectedCategories.length === 0 || 
        filters.selectedCategories.includes(transaction.categoria);
      
      const matchesPaymentStatus = 
        filters.paymentStatus === 'all' ||
        (filters.paymentStatus === 'paid' && transaction.is_paid) ||
        (filters.paymentStatus === 'unpaid' && !transaction.is_paid);
      
      return matchesSearch && matchesCategory && matchesPaymentStatus;
    });
  }, [transactions, filters]);

  // Separar por tipo e status de pagamento
  const categorizedTransactions = useMemo(() => {
    const entradas = filteredTransactions.filter(t => t.tipo_transacao === 'entrada');
    const gastos = filteredTransactions.filter(t => t.tipo_transacao === 'gasto');
    const recorrentes = filteredTransactions.filter(t => t.isRecurrent);
    
    // Separar gastos por status de pagamento
    const gastosPagos = gastos.filter(t => t.is_paid);
    const gastosNaoPagos = gastos.filter(t => !t.is_paid);

    return {
      all: filteredTransactions,
      entradas,
      gastos,
      gastosPagos,
      gastosNaoPagos,
      recorrentes
    };
  }, [filteredTransactions]);

  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      selectedCategories: [],
      paymentStatus: 'all'
    });
  };

  return {
    filters,
    updateFilters,
    clearFilters,
    filteredTransactions,
    categorizedTransactions
  };
};
