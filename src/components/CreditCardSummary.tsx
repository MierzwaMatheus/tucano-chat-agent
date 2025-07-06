
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, FileText, ArrowRight } from 'lucide-react';
import { useCreditCardData } from '@/hooks/useCreditCardData';

interface CreditCardSummaryProps {
  onViewDetails?: () => void;
}

export const CreditCardSummary: React.FC<CreditCardSummaryProps> = ({ onViewDetails }) => {
  const { summary, loading } = useCreditCardData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card className="glass border-white/20 backdrop-blur-lg bg-gray-900/90">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="glass border-white/20 backdrop-blur-lg bg-gray-900/90">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CreditCard className="h-5 w-5" />
            Cartão de Crédito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 text-sm">
            Configure seu cartão de crédito para visualizar o resumo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-white/20 backdrop-blur-lg bg-gray-900/90">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-white">
          <CreditCard className="h-5 w-5" />
          Resumo do Cartão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Fatura Atual:</span>
            <span className="text-lg font-bold text-red-400">
              {formatCurrency(summary.currentInvoice)}
            </span>
          </div>

          {summary.nextPaymentDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-300 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Próximo Pagamento:
              </span>
              <span className="text-sm font-medium text-white">
                {formatDate(summary.nextPaymentDate)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Parcelas Ativas:
            </span>
            <span className="text-sm font-medium text-white">
              {summary.activeInstallments}
            </span>
          </div>
        </div>

        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="w-full glass border-white/20 text-white hover:bg-white/10"
          >
            Ver Fatura Detalhada
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
