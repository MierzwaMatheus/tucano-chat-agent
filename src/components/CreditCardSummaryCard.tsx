
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, ArrowRight } from 'lucide-react';
import { CreditCardSummary } from '@/hooks/useMonthlyTransactions';

interface CreditCardSummaryCardProps {
  summary: CreditCardSummary;
  onViewDetails: () => void;
}

export const CreditCardSummaryCard: React.FC<CreditCardSummaryCardProps> = ({
  summary,
  onViewDetails
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card 
      className="glass border-white/20 backdrop-blur-lg hover:bg-white/5 transition-all cursor-pointer group"
      onClick={onViewDetails}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <CreditCard className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Cartão de Crédito</h3>
              <p className="text-sm text-gray-400">
                {summary.transactionCount} {summary.transactionCount === 1 ? 'compra' : 'compras'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-red-400">
              {formatCurrency(summary.totalAmount)}
            </p>
            <div className="flex items-center gap-1 text-sm text-gray-400 group-hover:text-white transition-colors">
              <span>Ver detalhes</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
