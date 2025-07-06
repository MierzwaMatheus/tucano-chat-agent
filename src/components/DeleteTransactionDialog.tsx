
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NormalizedTransaction } from '@/hooks/useTransactionFilters';

interface DeleteTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: NormalizedTransaction | null;
  onTransactionDeleted: () => void;
}

export const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionDeleted
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!transaction) return;

    setLoading(true);
    try {
      if (transaction.isRecurrent) {
        // Delete recurrence
        const { error } = await supabase
          .from('recorrencias')
          .delete()
          .eq('id', transaction.id);

        if (error) throw error;
      } else {
        // Delete regular transaction
        const { error } = await supabase
          .from('transacoes')
          .delete()
          .eq('id', transaction.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      });

      onTransactionDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="glass border-white/20 backdrop-blur-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir {transaction?.isRecurrent ? 'esta recorrência' : 'esta transação'}?
            <br />
            <strong>{transaction?.nome_gasto}</strong> - {' '}
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(transaction?.valor_gasto || 0)}
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onClose}
            disabled={loading}
            className="glass border-white/20"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
