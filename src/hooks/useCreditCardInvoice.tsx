
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCreditCardSettings } from './useCreditCardSettings';
import { MonthYear } from './useMonthSelector';

export interface CreditTransaction {
  id: string;
  nome_gasto: string;
  valor_gasto: number;
  categoria: string;
  data_transacao: string;
  purchase_date: string;
  total_amount?: number;
  installments?: number;
  is_subscription?: boolean;
  is_paid?: boolean;
}

export const useCreditCardInvoice = (selectedMonth: MonthYear) => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useCreditCardSettings();

  const fetchInvoiceTransactions = async () => {
    if (!user || !settings?.enabled) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      const paymentDay = settings.payment_day;
      
      // Calcular período da fatura baseado no mês selecionado
      let invoiceStartDate: Date;
      let invoiceEndDate: Date;

      const now = new Date();
      const isCurrentMonth = selectedMonth.month === now.getMonth() && selectedMonth.year === now.getFullYear();
      
      if (isCurrentMonth) {
        // Mês atual - usar lógica baseada no dia de pagamento
        const currentDay = now.getDate();
        
        if (currentDay <= paymentDay) {
          // Antes do pagamento - mostrar fatura atual (do mês anterior até hoje)
          invoiceStartDate = new Date(selectedMonth.year, selectedMonth.month - 1, paymentDay + 1);
          invoiceEndDate = new Date(selectedMonth.year, selectedMonth.month, paymentDay);
        } else {
          // Depois do pagamento - mostrar próxima fatura (de hoje até próximo pagamento)
          invoiceStartDate = new Date(selectedMonth.year, selectedMonth.month, paymentDay + 1);
          invoiceEndDate = new Date(selectedMonth.year, selectedMonth.month + 1, paymentDay);
        }
      } else {
        // Mês específico selecionado - mostrar fatura que teve pagamento naquele mês
        // Exemplo: se selecionamos julho, mostrar compras de 11/06 até 10/07
        invoiceStartDate = new Date(selectedMonth.year, selectedMonth.month - 1, paymentDay + 1);
        invoiceEndDate = new Date(selectedMonth.year, selectedMonth.month, paymentDay);
      }

      console.log('Fetching credit transactions for period:', {
        start: invoiceStartDate.toISOString().split('T')[0],
        end: invoiceEndDate.toISOString().split('T')[0]
      });

      const { data: creditTransactions, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .not('purchase_date', 'is', null)
        .gte('data_transacao', invoiceStartDate.toISOString().split('T')[0])
        .lte('data_transacao', invoiceEndDate.toISOString().split('T')[0])
        .order('data_transacao', { ascending: false });

      if (error) throw error;

      console.log('Found credit transactions:', creditTransactions?.length || 0);
      setTransactions(creditTransactions || []);
    } catch (error) {
      console.error('Error fetching credit card invoice:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceTransactions();
  }, [user, settings, selectedMonth]);

  return {
    transactions,
    loading,
    refetch: fetchInvoiceTransactions,
  };
};
