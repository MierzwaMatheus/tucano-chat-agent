
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCreditCardSettings } from './useCreditCardSettings';
import { MonthYear } from './useMonthSelector';
import { NormalizedTransaction } from './useTransactionFilters';

export interface CreditCardSummary {
  totalAmount: number;
  transactionCount: number;
  isPaid: boolean;
}

export interface PendingBalance {
  totalPending: number;
  unpaidCount: number;
}

export const useMonthlyTransactions = (selectedMonth: MonthYear) => {
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([]);
  const [creditCardSummary, setCreditCardSummary] = useState<CreditCardSummary | null>(null);
  const [pendingBalance, setPendingBalance] = useState<PendingBalance>({ totalPending: 0, unpaidCount: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useCreditCardSettings();

  // Helper function to check if a recurrence should be included for a given month
  const shouldIncludeRecurrence = (recurrence: any, targetMonth: MonthYear): boolean => {
    const startDate = new Date(recurrence.data_inicio);
    const endDate = recurrence.data_fim ? new Date(recurrence.data_fim) : null;
    
    const targetDate = new Date(targetMonth.year, targetMonth.month, 1);
    
    // Check if recurrence started before or during target month
    if (startDate > targetDate) {
      return false;
    }
    
    // Check if recurrence ended before target month
    if (endDate && endDate < targetDate) {
      return false;
    }
    
    return true;
  };

  const fetchMonthlyData = async () => {
    if (!user) {
      setTransactions([]);
      setCreditCardSummary(null);
      setPendingBalance({ totalPending: 0, unpaidCount: 0 });
      setLoading(false);
      return;
    }

    try {
      const startDate = new Date(selectedMonth.year, selectedMonth.month, 1);
      const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0);

      // Buscar transações regulares (sem crédito)
      const { data: regularTransactions, error: regularError } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .is('purchase_date', null)
        .gte('data_transacao', startDate.toISOString().split('T')[0])
        .lte('data_transacao', endDate.toISOString().split('T')[0])
        .order('data_transacao', { ascending: false });

      if (regularError) throw regularError;

      // Buscar recorrências ativas
      const { data: recurrences, error: recurrenceError } = await supabase
        .from('recorrencias')
        .select('*')
        .eq('user_id', user.id);

      if (recurrenceError) throw recurrenceError;

      // Filtrar recorrências que devem aparecer no mês selecionado
      const activeRecurrences = (recurrences || []).filter(rec => 
        shouldIncludeRecurrence(rec, selectedMonth)
      );

      // Converter recorrências para formato de transação
      const recurrenceTransactions: NormalizedTransaction[] = activeRecurrences.map(rec => ({
        id: `recurrence-${rec.id}-${selectedMonth.month}-${selectedMonth.year}`,
        nome_gasto: rec.nome_recorrencia,
        valor_gasto: Number(rec.valor_recorrencia),
        tipo_transacao: rec.tipo_transacao as 'entrada' | 'gasto',
        categoria: rec.categoria,
        data_transacao: new Date(selectedMonth.year, selectedMonth.month, new Date(rec.data_inicio).getDate()).toISOString().split('T')[0],
        isRecurrent: true,
        created_at: rec.created_at,
        is_paid: rec.tipo_transacao === 'entrada' ? true : false
      }));

      // Normalizar transações regulares
      const normalizedTransactions: NormalizedTransaction[] = (regularTransactions || []).map(t => ({
        id: t.id,
        nome_gasto: t.nome_gasto,
        valor_gasto: Number(t.valor_gasto),
        tipo_transacao: t.tipo_transacao as 'entrada' | 'gasto',
        categoria: t.categoria,
        data_transacao: t.data_transacao,
        isRecurrent: t.is_recorrente || false,
        created_at: t.created_at,
        is_paid: t.is_paid || false
      }));

      // Combinar transações regulares com recorrências
      const allTransactions = [...normalizedTransactions, ...recurrenceTransactions];
      setTransactions(allTransactions);

      // Calcular saldo pendente (apenas gastos não pagos, excluindo recorrências)
      const unpaidGastos = allTransactions.filter(t => 
        t.tipo_transacao === 'gasto' && !t.is_paid && !t.isRecurrent
      );
      
      const totalPending = unpaidGastos.reduce((sum, t) => sum + t.valor_gasto, 0);
      setPendingBalance({
        totalPending,
        unpaidCount: unpaidGastos.length
      });

      // Buscar resumo do cartão de crédito se habilitado
      if (settings?.enabled) {
        const closingDay = settings.closing_day;
        const paymentDay = settings.payment_day;
        
        let invoiceStartDate: Date;
        let invoiceEndDate: Date;

        const now = new Date();
        const isCurrentMonth = selectedMonth.month === now.getMonth() && selectedMonth.year === now.getFullYear();
        
        if (isCurrentMonth) {
          const currentDay = now.getDate();
          
          if (currentDay <= paymentDay) {
            invoiceStartDate = new Date(selectedMonth.year, selectedMonth.month - 1, closingDay + 1);
            invoiceEndDate = new Date(selectedMonth.year, selectedMonth.month, closingDay);
          } else {
            invoiceStartDate = new Date(selectedMonth.year, selectedMonth.month, closingDay + 1);
            invoiceEndDate = new Date(selectedMonth.year, selectedMonth.month + 1, closingDay);
          }
        } else {
          invoiceStartDate = new Date(selectedMonth.year, selectedMonth.month - 1, closingDay + 1);
          invoiceEndDate = new Date(selectedMonth.year, selectedMonth.month, closingDay);
        }

        console.log('Fetching credit card summary for period:', {
          start: invoiceStartDate.toISOString().split('T')[0],
          end: invoiceEndDate.toISOString().split('T')[0]
        });

        const { data: creditTransactions, error: creditError } = await supabase
          .from('transacoes')
          .select('*')
          .eq('user_id', user.id)
          .not('purchase_date', 'is', null)
          .gte('data_transacao', invoiceStartDate.toISOString().split('T')[0])
          .lte('data_transacao', invoiceEndDate.toISOString().split('T')[0]);

        if (creditError) throw creditError;

        console.log('Found credit transactions for summary:', creditTransactions?.length || 0);

        if (creditTransactions && creditTransactions.length > 0) {
          const totalAmount = creditTransactions.reduce((sum, t) => sum + Number(t.valor_gasto), 0);
          const isPaid = creditTransactions.every(t => t.is_paid);
          
          setCreditCardSummary({
            totalAmount,
            transactionCount: creditTransactions.length,
            isPaid
          });
        } else {
          setCreditCardSummary(null);
        }
      } else {
        setCreditCardSummary(null);
      }

    } catch (error) {
      console.error('Error fetching monthly transactions:', error);
      setTransactions([]);
      setCreditCardSummary(null);
      setPendingBalance({ totalPending: 0, unpaidCount: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [user, selectedMonth, settings]);

  return {
    transactions,
    creditCardSummary,
    pendingBalance,
    loading,
    refetch: fetchMonthlyData,
  };
};
