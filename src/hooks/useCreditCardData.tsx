
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCreditCardSettings } from './useCreditCardSettings';

export interface CreditCardSummary {
  currentInvoice: number;
  nextPaymentDate: string | null;
  activeInstallments: number;
}

export const useCreditCardData = () => {
  const [summary, setSummary] = useState<CreditCardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useCreditCardSettings();

  const fetchCreditCardSummary = async () => {
    if (!user || !settings?.enabled) {
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      // Calcular período da fatura atual
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const closingDay = settings.closing_day;
      
      // Data de fechamento da fatura atual
      let currentClosingDate = new Date(currentYear, currentMonth, closingDay);
      if (now.getDate() <= closingDay) {
        // Estamos antes do fechamento, então pegar o mês anterior
        currentClosingDate = new Date(currentYear, currentMonth - 1, closingDay);
      }
      
      // Data de fechamento da próxima fatura
      const nextClosingDate = new Date(
        currentClosingDate.getFullYear(),
        currentClosingDate.getMonth() + 1,
        closingDay
      );

      // Buscar transações de crédito no período atual da fatura
      const { data: creditTransactions, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .not('purchase_date', 'is', null)
        .eq('is_paid', false)
        .gte('data_transacao', currentClosingDate.toISOString().split('T')[0])
        .lt('data_transacao', nextClosingDate.toISOString().split('T')[0]);

      if (error) throw error;

      // Calcular valores
      const currentInvoice = creditTransactions?.reduce((sum, transaction) => {
        return sum + Number(transaction.valor_gasto);
      }, 0) || 0;

      // Encontrar próxima data de pagamento
      const unpaidTransactions = creditTransactions?.filter(t => !t.is_paid) || [];
      const nextPaymentDate = unpaidTransactions.length > 0
        ? unpaidTransactions
            .map(t => t.data_transacao)
            .sort()[0]
        : null;

      // Contar parcelas ativas (transaction_group_ids únicos)
      const activeTransactionGroupIds = new Set(
        creditTransactions
          ?.filter(t => t.transaction_group_id && !t.is_paid)
          .map(t => t.transaction_group_id) || []
      );

      setSummary({
        currentInvoice,
        nextPaymentDate,
        activeInstallments: activeTransactionGroupIds.size,
      });

    } catch (error) {
      console.error('Error fetching credit card summary:', error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditCardSummary();
  }, [user, settings]);

  return {
    summary,
    loading,
    refetch: fetchCreditCardSummary,
  };
};
