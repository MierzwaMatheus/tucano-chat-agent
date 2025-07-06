
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NormalizedTransaction } from '@/hooks/useTransactionFilters';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: NormalizedTransaction | null;
  onTransactionUpdated: () => void;
}

const categories = [
  'Salário', 'Freelancer', 'Venda', 'Presentes',
  'Casa', 'Comida', 'Assinatura', 'Diversão', 'Outros'
];

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated
}) => {
  const [formData, setFormData] = useState({
    nome_gasto: '',
    valor_gasto: '',
    tipo_transacao: 'gasto' as 'entrada' | 'gasto',
    categoria: '',
    data_transacao: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (transaction) {
      setFormData({
        nome_gasto: transaction.nome_gasto,
        valor_gasto: transaction.valor_gasto.toString(),
        tipo_transacao: transaction.tipo_transacao,
        categoria: transaction.categoria,
        data_transacao: transaction.data_transacao
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);
    try {
      const updateData = {
        nome_gasto: formData.nome_gasto,
        valor_gasto: parseFloat(formData.valor_gasto),
        tipo_transacao: formData.tipo_transacao,
        categoria: formData.categoria,
        data_transacao: formData.data_transacao
      };

      if (transaction.isRecurrent) {
        // Update recurrence
        const { error } = await supabase
          .from('recorrencias')
          .update({
            nome_recorrencia: updateData.nome_gasto,
            valor_recorrencia: updateData.valor_gasto,
            tipo_transacao: updateData.tipo_transacao,
            categoria: updateData.categoria,
            data_inicio: updateData.data_transacao
          })
          .eq('id', transaction.id);

        if (error) throw error;
      } else {
        // Update regular transaction
        const { error } = await supabase
          .from('transacoes')
          .update(updateData)
          .eq('id', transaction.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso!",
      });

      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar transação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nome_gasto: '',
      valor_gasto: '',
      tipo_transacao: 'gasto',
      categoria: '',
      data_transacao: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass border-white/20 backdrop-blur-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Editar {transaction?.isRecurrent ? 'Recorrência' : 'Transação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome_gasto">Nome</Label>
            <Input
              id="nome_gasto"
              value={formData.nome_gasto}
              onChange={(e) => setFormData({ ...formData, nome_gasto: e.target.value })}
              required
              className="glass border-white/20"
            />
          </div>

          <div>
            <Label htmlFor="valor_gasto">Valor</Label>
            <Input
              id="valor_gasto"
              type="number"
              step="0.01"
              value={formData.valor_gasto}
              onChange={(e) => setFormData({ ...formData, valor_gasto: e.target.value })}
              required
              className="glass border-white/20"
            />
          </div>

          <div>
            <Label htmlFor="tipo_transacao">Tipo</Label>
            <Select
              value={formData.tipo_transacao}
              onValueChange={(value: 'entrada' | 'gasto') => 
                setFormData({ ...formData, tipo_transacao: value })
              }
            >
              <SelectTrigger className="glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="gasto">Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData({ ...formData, categoria: value })}
            >
              <SelectTrigger className="glass border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="data_transacao">
              {transaction?.isRecurrent ? 'Data de Início' : 'Data'}
            </Label>
            <Input
              id="data_transacao"
              type="date"
              value={formData.data_transacao}
              onChange={(e) => setFormData({ ...formData, data_transacao: e.target.value })}
              required
              className="glass border-white/20"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="glass border-white/20"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-tucano-500 hover:bg-tucano-600"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
