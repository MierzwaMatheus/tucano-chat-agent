
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCreditCardSettings } from './useCreditCardSettings';
import { MonthYear } from './useMonthSelector';
import { NormalizedTransaction } from './useTransactionFilters';

export interface CreditCardSummary {
  totalAmount: number;
  transactionCount: number;
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
        .is('purchase_date', null) // Apenas transações que NÃO são de crédito
        .gte('data_transacao', startDate.toISOString().split('T')[0])
        .lte('data_transacao', endDate.toISOString().split('T')[0])
        .order('data_transacao', { ascending: false });

      if (regularError) throw regularError;

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

      setTransactions(normalizedTransactions);

      // Calcular saldo pendente (apenas gastos não pagos)
      const unpaidGastos = normalizedTransactions.filter(t => 
        t.tipo_transacao === 'gasto' && !t.is_paid
      );
      
      const totalPending = unpaidGastos.reduce((sum, t) => sum + t.valor_gasto, 0);
      setPendingBalance({
        totalPending,
        unpaidCount: unpaidGastos.length
      });

      // Buscar resumo do cartão de crédito se habilitado
      if (settings?.enabled) {
        const { data: creditTransactions, error: creditError } = await supabase
          .from('transacoes')
          .select('valor_gasto')
          .eq('user_id', user.id)
          .not('purchase_date', 'is', null) // Apenas transações de crédito
          .gte('data_transacao', startDate.toISOString().split('T')[0])
          .lte('data_transacao', endDate.toISOString().split('T')[0]);

        if (creditError) throw creditError;

        if (creditTransactions && creditTransactions.length > 0) {
          const totalAmount = creditTransactions.reduce((sum, t) => sum + Number(t.valor_gasto), 0);
          setCreditCardSummary({
            totalAmount,
            transactionCount: creditTransactions.length
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
