
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categorias = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Entretenimento',
  'Compras',
  'Salário',
  'Freelance',
  'Investimentos',
  'Outros'
];

export const AddTransactionModal = ({ isOpen, onClose }: AddTransactionModalProps) => {
  const [formData, setFormData] = useState({
    nome_gasto: '',
    valor_gasto: '',
    tipo_transacao: 'gasto' as 'entrada' | 'gasto',
    categoria: '',
    data_transacao: new Date().toISOString().split('T')[0],
    is_recorrente: false,
  });

  const { addTransaction } = useTransactions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addTransaction({
      ...formData,
      valor_gasto: parseFloat(formData.valor_gasto),
    });
    
    // Reset form
    setFormData({
      nome_gasto: '',
      valor_gasto: '',
      tipo_transacao: 'gasto',
      categoria: '',
      data_transacao: new Date().toISOString().split('T')[0],
      is_recorrente: false,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md glass-strong border-white/20 backdrop-blur-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Adicionar Transação</CardTitle>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={formData.nome_gasto}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_gasto: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-tucano-500"
                placeholder="Ex: Almoço, Salário, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor_gasto}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_gasto: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-tucano-500"
                placeholder="0,00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="entrada"
                    checked={formData.tipo_transacao === 'entrada'}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_transacao: e.target.value as 'entrada' | 'gasto' }))}
                    className="mr-2 text-tucano-500"
                  />
                  Entrada
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="gasto"
                    checked={formData.tipo_transacao === 'gasto'}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo_transacao: e.target.value as 'entrada' | 'gasto' }))}
                    className="mr-2 text-tucano-500"
                  />
                  Gasto
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-tucano-500"
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={formData.data_transacao}
                onChange={(e) => setFormData(prev => ({ ...prev, data_transacao: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-white/20 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-tucano-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-tucano-500 to-tucano-600 hover:from-tucano-600 hover:to-tucano-700"
              >
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
