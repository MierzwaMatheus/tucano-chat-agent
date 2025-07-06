
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { CreditCard, Eye } from 'lucide-react';
import { useTransactionPayment } from '@/hooks/useTransactionPayment';
import { useCreditCardInvoice } from '@/hooks/useCreditCardInvoice';
import { useMonthSelector } from '@/hooks/useMonthSelector';

interface CreditCardSummary {
  totalAmount: number;
  transactionCount: number;
  isPaid: boolean;
}

interface CreditCardSummaryCardProps {
  summary: CreditCardSummary;
  onViewDetails: () => void;
}

export const CreditCardSummaryCard: React.FC<CreditCardSummaryCardProps> = ({
  summary,
  onViewDetails,
}) => {
  const { updatePaymentStatus, loading } = useTransactionPayment();
  const { selectedMonth } = useMonthSelector();
  const { transactions, refetch } = useCreditCardInvoice(selectedMonth);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handlePaymentToggle = async (isPaid: boolean) => {
    // Atualizar todas as transações de crédito da fatura
    const promises = transactions.map(transaction => 
      updatePaymentStatus(transaction.id, isPaid)
    );

    const results = await Promise.all(promises);
    
    if (results.every(result => result)) {
      refetch();
    }
  };

  return (
    <Card className="glass border-white/20 backdrop-blur-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Cartão de Crédito
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewDetails}
          className="text-white hover:bg-white/10"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(summary.totalAmount)}
              </div>
              <p className="text-sm text-gray-300">
                {summary.transactionCount} {summary.transactionCount === 1 ? 'compra' : 'compras'} na fatura
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {summary.isPaid ? 'Pago' : 'Pendente'}
              </span>
              <Switch
                checked={summary.isPaid}
                onCheckedChange={handlePaymentToggle}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
