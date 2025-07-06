
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar, ArrowUpCircle, ArrowDownCircle, Repeat, Pencil, Trash2, CreditCard } from 'lucide-react';
import { Button } from './button';

interface TransactionCardProps {
  id: string;
  tipo_transacao: 'entrada' | 'gasto';
  nome_gasto: string;
  categoria: string;
  valor_gasto: number;
  data_transacao: string;
  isRecurrent?: boolean;
  is_paid?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onPaymentToggle?: (id: string, isPaid: boolean) => void;
  showCreditInfo?: boolean;
  purchase_date?: string;
  total_amount?: number;
  installments?: number;
  is_subscription?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  id,
  tipo_transacao,
  nome_gasto,
  categoria,
  valor_gasto,
  data_transacao,
  isRecurrent = false,
  is_paid = false,
  onEdit,
  onDelete,
  onPaymentToggle,
  showCreditInfo = false,
  purchase_date,
  total_amount,
  installments,
  is_subscription
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTransactionIcon = (tipo: 'entrada' | 'gasto', isRecurrent?: boolean) => {
    if (isRecurrent) {
      return <Repeat className="h-4 w-4 text-blue-500" />;
    }
    return tipo === 'entrada' 
      ? <ArrowUpCircle className="h-4 w-4 text-green-500" />
      : <ArrowDownCircle className="h-4 w-4 text-red-500" />;
  };

  const getCreditInfo = () => {
    if (!showCreditInfo || !purchase_date) return null;

    if (is_subscription) {
      return "Assinatura";
    }

    if (installments && installments > 1) {
      // Calcular qual parcela é esta baseada na data
      const purchaseDate = new Date(purchase_date);
      const transactionDate = new Date(data_transacao);
      const monthsDiff = (transactionDate.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                        (transactionDate.getMonth() - purchaseDate.getMonth());
      const currentInstallment = Math.max(1, monthsDiff + 1);
      return `${currentInstallment}/${installments}`;
    }

    return "À vista";
  };

  return (
    <Card className={`glass border-white/20 backdrop-blur-lg hover:border-white/40 transition-all duration-300 group ${
      tipo_transacao === 'gasto' && !is_paid ? 'border-orange-500/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTransactionIcon(tipo_transacao, isRecurrent)}
            <Badge 
              variant="outline" 
              className="text-xs border-white/30 text-gray-300"
            >
              {categoria}
            </Badge>
            {tipo_transacao === 'gasto' && !is_paid && (
              <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                Pendente
              </Badge>
            )}
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(id)}
              className="h-8 w-8 p-0 hover:bg-white/10"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium text-white text-sm leading-tight">
            {nome_gasto}
          </h3>
          
          <div className="flex items-center justify-between">
            <span className={`text-lg font-bold ${
              tipo_transacao === 'entrada' ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(valor_gasto)}
            </span>
            
            {tipo_transacao === 'gasto' && onPaymentToggle && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {is_paid ? 'Pago' : 'Pendente'}
                </span>
                <Switch
                  checked={is_paid}
                  onCheckedChange={(checked) => onPaymentToggle(id, checked)}
                />
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Pagamento: {formatDate(data_transacao)}</span>
            </div>
            
            {showCreditInfo && purchase_date && (
              <>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  <span>Compra: {formatDate(purchase_date)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">{getCreditInfo()}</span>
                  {total_amount && total_amount !== valor_gasto && (
                    <span className="text-gray-300">
                      Total: {formatCurrency(total_amount)}
                    </span>
                  )}
                </div>
              </>
            )}
            
            {isRecurrent && (
              <div className="flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                <span>Recorrente</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
