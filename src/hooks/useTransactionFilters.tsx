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
  showCreditOnly?: boolean;
  transactionType?: 'entrada' | 'gasto' | 'all';
}

// Extended type that normalizes the differences between Transaction and Recurrence
export interface NormalizedTransaction {
  id: string;
  nome_gasto: string;
  valor_gasto: number;
  tipo_transacao: 'entrada' | 'gasto';
  categoria: string;
  data_transacao: string;
  isRecurrent: boolean;
  created_at?: string;
  // Novos campos para crédito
  purchase_date?: string;
  total_amount?: number;
  installments?: number;
  is_subscription?: boolean;
}

export interface PaginatedTransactions {
  transactions: NormalizedTransaction[];
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
    showCreditOnly: false,
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

  // Normalize transaction data to have consistent properties
  const normalizeTransaction = (item: any): NormalizedTransaction => ({
    id: item.id,
    nome_gasto: item.nome_gasto,
    valor_gasto: Number(item.valor_gasto),
    tipo_transacao: item.tipo_transacao as 'entrada' | 'gasto',
    categoria: item.categoria,
    data_transacao: item.data_transacao,
    isRecurrent: false,
    created_at: item.created_at,
    // Campos de crédito
    purchase_date: item.purchase_date,
    total_amount: item.total_amount ? Number(item.total_amount) : undefined,
    installments: item.installments,
    is_subscription: item.is_subscription
  });

  // Normalize recurrence data to have consistent properties
  const normalizeRecurrence = (item: any): NormalizedTransaction => ({
    id: item.id,
    nome_gasto: item.nome_recorrencia,
    valor_gasto: Number(item.valor_recorrencia),
    tipo_transacao: item.tipo_transacao as 'entrada' | 'gasto',
    categoria: item.categoria,
    data_transacao: item.data_inicio,
    isRecurrent: true,
    created_at: item.created_at
  });

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

      // Filtro específico para crédito
      if (filters.showCreditOnly) {
        transactionsQuery = transactionsQuery.not('purchase_date', 'is', null);
      }

      let allTransactions: NormalizedTransaction[] = [];

      if (!filters.showRecurrentOnly && !filters.showCreditOnly) {
        const { data: transactions } = await transactionsQuery
          .order('data_transacao', { ascending: false });
        
        if (transactions) {
          allTransactions = [...allTransactions, ...transactions.map(normalizeTransaction)];
        }
      } else if (filters.showCreditOnly) {
        // Buscar apenas transações de crédito
        const { data: transactions } = await transactionsQuery
          .order('data_transacao', { ascending: false });
        
        if (transactions) {
          allTransactions = [...allTransactions, ...transactions.map(normalizeTransaction)];
        }
      }

      // Always fetch recurrences for "Recorrentes" tab or when showRecurrentOnly is true
      if (filters.showRecurrentOnly) {
        const { data: recurrences } = await recurrencesQuery
          .order('data_inicio', { ascending: false });
        
        if (recurrences) {
          allTransactions = [...allTransactions, ...recurrences.map(normalizeRecurrence)];
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
    changePage,
    refetch: () => fetchFilteredTransactions(paginatedData.page)
  };
};
