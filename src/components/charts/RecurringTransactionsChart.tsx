import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecurringTransactionsChartProps {
  data: Array<{
    nome: string;
    frequencia: number;
    valor: number;
  }>;
}

export const RecurringTransactionsChart: React.FC<RecurringTransactionsChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="glass border-white/20 backdrop-blur-lg bg-gray-900/90">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          Transações Recorrentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              type="number"
              stroke="#e5e7eb"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <YAxis 
              type="category"
              dataKey="nome"
              stroke="#e5e7eb"
              fontSize={12}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number, name) => {
                if (name === 'valor') return [formatCurrency(value), 'Valor'];
                return [value, 'Frequência'];
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar 
              dataKey="valor" 
              fill="#8b5cf6"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}; 