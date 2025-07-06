
import { useState } from 'react';

export interface MonthYear {
  month: number;
  year: number;
}

export const useMonthSelector = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<MonthYear>({
    month: now.getMonth(),
    year: now.getFullYear()
  });

  const formatMonthYear = (monthYear: MonthYear) => {
    const date = new Date(monthYear.year, monthYear.month, 1);
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getMonthOptions = () => {
    const options = [];
    const current = new Date();
    
    // Últimos 12 meses + próximos 3 meses
    for (let i = -12; i <= 3; i++) {
      const date = new Date(current.getFullYear(), current.getMonth() + i, 1);
      options.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: formatMonthYear({ month: date.getMonth(), year: date.getFullYear() })
      });
    }
    
    return options;
  };

  const getMonthDateRange = (monthYear: MonthYear) => {
    const startDate = new Date(monthYear.year, monthYear.month, 1);
    const endDate = new Date(monthYear.year, monthYear.month + 1, 0);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  return {
    selectedMonth,
    setSelectedMonth,
    formatMonthYear,
    getMonthOptions,
    getMonthDateRange
  };
};
