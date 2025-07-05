import React, { useEffect, useRef } from "react";
import { ArrowUpCircle, ArrowDownCircle, Repeat, Pencil, Trash } from "lucide-react";
import { Button } from "./button";

const BAUHAUS_CARD_STYLES = `
.bauhaus-card {
  position: relative;
  z-index: 1;
  width: 100%;
  min-height: 12rem;
  display: grid;
  place-content: center;
  place-items: center;
  text-align: center;
  box-shadow: 1px 12px 25px rgb(0,0,0/20%);
  border-radius: var(--card-radius, 20px);
  border: var(--card-border-width, 2px) solid transparent;
  --rotation: 4.2rad;
  background-image:
    linear-gradient(var(--card-bg), var(--card-bg)),
    linear-gradient(calc(var(--rotation,4.2rad)), var(--card-accent) 0, var(--card-bg) 30%, transparent 80%);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  color: var(--card-text-main);
  transition: all 0.3s ease;
}

.bauhaus-card:hover {
  transform: translateY(-5px);
  box-shadow: 1px 15px 30px rgb(0,0,0/30%);
}

.bauhaus-card-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.bauhaus-date {
  color: var(--card-text-top);
  font-size: 0.875rem;
}

.bauhaus-card-body {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 3.5rem 1.5rem 1.5rem;
}

.bauhaus-card-body h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--card-text-main);
}

.bauhaus-card-body p {
  color: var(--card-text-sub);
  font-size: 0.875rem;
}

.bauhaus-card-footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0 1.5rem 1rem;
}

.bauhaus-actions {
  display: flex;
  gap: 0.5rem;
}

.bauhaus-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bauhaus-amount {
  font-size: 1.25rem;
  font-weight: 600;
}
`;

function injectBauhausCardStyles() {
  if (typeof window === "undefined") return;
  if (!document.getElementById("bauhaus-card-styles")) {
    const style = document.createElement("style");
    style.id = "bauhaus-card-styles";
    style.innerHTML = BAUHAUS_CARD_STYLES;
    document.head.appendChild(style);
  }
}

export interface TransactionCardProps {
  id: string;
  tipo_transacao: 'entrada' | 'gasto';
  nome_gasto: string;
  categoria: string;
  valor_gasto: number;
  data_transacao: string;
  isRecurrent?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  id,
  tipo_transacao,
  nome_gasto,
  categoria,
  valor_gasto,
  data_transacao,
  isRecurrent,
  onEdit,
  onDelete
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectBauhausCardStyles();
    const card = cardRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      if (card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const angle = Math.atan2(-x, y);
        card.style.setProperty("--rotation", angle + "rad");
      }
    };
    if (card) {
      card.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      if (card) {
        card.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTransactionIcon = () => {
    if (isRecurrent) {
      return <Repeat className="h-5 w-5 text-blue-500" />;
    }
    return tipo_transacao === 'entrada' 
      ? <ArrowUpCircle className="h-5 w-5 text-green-500" />
      : <ArrowDownCircle className="h-5 w-5 text-red-500" />;
  };

  const accentColor = tipo_transacao === 'entrada' ? '#22c55e' : '#ef4444';

  return (
    <div
      className="bauhaus-card"
      ref={cardRef}
      style={{
        '--card-bg': 'hsl(var(--card))',
        '--card-accent': accentColor,
        '--card-text-main': 'hsl(var(--card-foreground))',
        '--card-text-top': 'hsl(var(--muted-foreground))',
        '--card-text-sub': 'hsl(var(--muted-foreground))',
      } as React.CSSProperties}
    >
      <div className="bauhaus-card-header">
        <div className="bauhaus-date">
          {formatDate(data_transacao)}
        </div>
        <div className="bauhaus-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit?.(id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="bauhaus-card-body">
        <div className="bauhaus-icon">
          {getTransactionIcon()}
          <h3>{nome_gasto}</h3>
        </div>
        <p>{categoria}</p>
        <div className="bauhaus-amount mt-4" style={{ color: accentColor }}>
          {tipo_transacao === 'entrada' ? '+' : '-'}{formatCurrency(valor_gasto)}
        </div>
      </div>
    </div>
  );
}; 