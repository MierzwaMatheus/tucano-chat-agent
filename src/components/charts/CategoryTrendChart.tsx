import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryTrendChartProps {
  data: Array<{
    date: string;
    [key: string]: number | string;
  }>;
}

export const CategoryTrendChart: React.FC<CategoryTrendChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Cores para cada categoria
  const categoryColors = {
    'Salário': '#8b5cf6', // tucano-500
    'Freelancer': '#7c3aed', // tucano-600
    'Venda': '#6d28d9', // tucano-700
    'Presentes': '#5b21b6', // tucano-800
    'Casa': '#a78bfa', // tucano-400
    'Comida': '#c4b5fd', // tucano-300
    'Assinatura': '#ddd6fe', // tucano-200
    'Diversão': '#ede8ff', // tucano-100
    'Outros': '#6B7280', // cinza neutro
  };

  // Extrair categorias únicas dos dados (excluindo a coluna 'date')
  const categories = Object.keys(data[0] || {}).filter(key => key !== 'date');

  return (
    <Card className="glass border-white/20 backdrop-blur-lg bg-gray-900/90">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">
          Tendência por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="date" 
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
            {categories.map((category) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                name={category}
                stroke={categoryColors[category] || '#6B7280'}
                strokeWidth={2}
                dot={{ fill: categoryColors[category] || '#6B7280', r: 3 }}
                activeDot={{ r: 5, strokeWidth: 1 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}; 