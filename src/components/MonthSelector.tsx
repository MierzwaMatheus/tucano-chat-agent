
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { MonthYear } from '@/hooks/useMonthSelector';

interface MonthSelectorProps {
  selectedMonth: MonthYear;
  onMonthChange: (monthYear: MonthYear) => void;
  options: Array<{
    month: number;
    year: number;
    label: string;
  }>;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
  options
}) => {
  const handleValueChange = (value: string) => {
    const [month, year] = value.split('-').map(Number);
    onMonthChange({ month, year });
  };

  const currentValue = `${selectedMonth.month}-${selectedMonth.year}`;

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="w-48 glass border-white/20">
          <SelectValue placeholder="Selecione o mês" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={`${option.month}-${option.year}`} 
              value={`${option.month}-${option.year}`}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
