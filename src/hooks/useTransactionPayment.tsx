
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useTransactionPayment = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updatePaymentStatus = async (transactionId: string, isPaid: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ is_paid: isPaid })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Transação marcada como ${isPaid ? 'paga' : 'não paga'}`,
      });

      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status de pagamento",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updatePaymentStatus,
    loading,
  };
};
