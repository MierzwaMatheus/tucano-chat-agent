
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Transaction, Recurrence } from './useTransactions';

export interface TransactionFilters {
  searchTerm: string;
  categories: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  showRecurrentOnly: boolean;
  transactionType?: 'entrada' | 'gasto' | 'all';
}

export interface PaginatedTransactions {
  transactions: (Transaction | Recurrence)[];
  total: number;
  page: number;
  totalPages: number;
}

export const useTransactionFilters = () => {
  const [filters, setFilters] = useState<TransactionFilters>({
    searchTerm: '',
    categories: [],
    dateRange: {},
    showRecurrentOnly: false,
    transactionType: 'all'
  });
  
  const [paginatedData, setPaginatedData] = useState<PaginatedTransactions>({
    transactions: [],
    total: 0,
    page: 1,
    totalPages: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const { user } = useAuth();

  const ITEMS_PER_PAGE = 20;

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const [transactionCategories, recurrenceCategories] = await Promise.all([
          supabase
            .from('transacoes')
            .select('categoria')
            .eq('user_id', user.id),
          supabase
            .from('recorrencias')
            .select('categoria')
            .eq('user_id', user.id)
        ]);

        const allCategories = new Set([
          ...(transactionCategories.data?.map(t => t.categoria) || []),
          ...(recurrenceCategories.data?.map(r => r.categoria) || [])
        ]);

        setAvailableCategories(Array.from(allCategories).sort());
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [user]);

  // Fetch filtered transactions
  const fetchFilteredTransactions = async (page: number = 1) => {
    if (!user) return;

    setLoading(true);
    try {
      let transactionsQuery = supabase
        .from('transacoes')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      let recurrencesQuery = supabase
        .from('recorrencias')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (filters.searchTerm) {
        transactionsQuery = transactionsQuery.ilike('nome_gasto', `%${filters.searchTerm}%`);
        recurrencesQuery = recurrencesQuery.ilike('nome_recorrencia', `%${filters.searchTerm}%`);
      }

      if (filters.categories.length > 0) {
        transactionsQuery = transactionsQuery.in('categoria', filters.categories);
        recurrencesQuery = recurrencesQuery.in('categoria', filters.categories);
      }

      if (filters.transactionType && filters.transactionType !== 'all') {
        transactionsQuery = transactionsQuery.eq('tipo_transacao', filters.transactionType);
        recurrencesQuery = recurrencesQuery.eq('tipo_transacao', filters.transactionType);
      }

      if (filters.dateRange.start) {
        transactionsQuery = transactionsQuery.gte('data_transacao', filters.dateRange.start);
        recurrencesQuery = recurrencesQuery.gte('data_inicio', filters.dateRange.start);
      }

      if (filters.dateRange.end) {
        transactionsQuery = transactionsQuery.lte('data_transacao', filters.dateRange.end);
        recurrencesQuery = recurrencesQuery.lte('data_inicio', filters.dateRange.end);
      }

      let allTransactions: (Transaction | Recurrence)[] = [];

      if (!filters.showRecurrentOnly) {
        const { data: transactions } = await transactionsQuery
          .order('data_transacao', { ascending: false });
        
        if (transactions) {
          allTransactions = [...allTransactions, ...transactions.map(t => ({
            ...t,
            tipo_transacao: t.tipo_transacao as 'entrada' | 'gasto',
            isRecurrent: false
          }))];
        }
      }

      // Always fetch recurrences for "Recorrentes" tab or when showRecurrentOnly is true
      if (filters.showRecurrentOnly || filters.transactionType === 'all') {
        const { data: recurrences } = await recurrencesQuery
          .order('data_inicio', { ascending: false });
        
        if (recurrences) {
          allTransactions = [...allTransactions, ...recurrences.map(r => ({
            ...r,
            nome_gasto: r.nome_recorrencia,
            valor_gasto: r.valor_recorrencia,
            data_transacao: r.data_inicio,
            tipo_transacao: r.tipo_transacao as 'entrada' | 'gasto',
            isRecurrent: true
          }))];
        }
      }

      // Sort all transactions by date
      allTransactions.sort((a, b) => 
        new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime()
      );

      // Apply pagination
      const total = allTransactions.length;
      const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

      setPaginatedData({
        transactions: paginatedTransactions,
        total,
        page,
        totalPages
      });

    } catch (error) {
      console.error('Error fetching filtered transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredTransactions(1);
  }, [filters, user]);

  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const changePage = (newPage: number) => {
    fetchFilteredTransactions(newPage);
  };

  return {
    filters,
    updateFilters,
    paginatedData,
    loading,
    availableCategories,
    changePage
  };
};
