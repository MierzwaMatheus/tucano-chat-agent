import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailyTransactionChartProps {
  data: Array<{
    dia: number;
    entradas: number;
    saidas: number;
  }>;
}

export const DailyTransactionChart: React.FC<DailyTransactionChartProps> = ({ data }) => {
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
          Movimentações por Dia do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="dia" 
              stroke="#e5e7eb"
              fontSize={12}
            />
            <YAxis 
              stroke="#e5e7eb"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [formatCurrency(value), '']}
              labelStyle={{ color: '#fff' }}
            />
            <Legend 
              wrapperStyle={{ color: '#fff' }}
            />
            <Bar 
              dataKey="entradas" 
              fill="#8b5cf6" 
              name="Entradas"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="saidas" 
              fill="#6d28d9" 
              name="Saídas"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}; 