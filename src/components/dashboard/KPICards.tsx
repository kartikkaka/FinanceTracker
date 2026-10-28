import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Percent,
  Clock,
  Calendar,
  Minus,
} from 'lucide-react';
import type { KPIData } from '../../types';
import { formatINR, formatINRCompact, calcPercentChange } from '../../utils/helpers';

interface KPICardsProps {
  data: KPIData;
}

export default function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      label: 'Total Revenue',
      value: data.totalRevenue,
      prev: data.prevTotalRevenue,
      icon: ArrowUpCircle,
      type: 'revenue' as const,
      invertChange: false,
    },
    {
      label: 'Total Expenses',
      value: data.totalExpenses,
      prev: data.prevTotalExpenses,
      icon: ArrowDownCircle,
      type: 'expense' as const,
      invertChange: true,
    },
    {
      label: 'Net Profit / Loss',
      value: data.netProfit,
      prev: data.prevNetProfit,
      icon: DollarSign,
      type: 'profit' as const,
      invertChange: false,
    },
    {
      label: 'Profit Margin',
      value: data.profitMargin,
      prev: data.prevProfitMargin,
      icon: Percent,
      type: 'profit' as const,
      isPercent: true,
      invertChange: false,
    },
    {
      label: 'Pending Payments',
      value: data.pendingPayments,
      prev: data.prevPendingPayments,
      icon: Clock,
      type: 'pending' as const,
      invertChange: true,
    },
    {
      label: 'Monthly Revenue',
      value: data.monthlyRevenue,
      prev: data.prevMonthlyRevenue,
      icon: Calendar,
      type: 'revenue' as const,
      invertChange: false,
    },
    {
      label: 'Monthly Expenses',
      value: data.monthlyExpenses,
      prev: data.prevMonthlyExpenses,
      icon: Calendar,
      type: 'expense' as const,
      invertChange: true,
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card) => {
        const change = calcPercentChange(card.value, card.prev);
        const isPositive = card.invertChange ? change <= 0 : change >= 0;
        const changeClass = change === 0 ? 'neutral' : isPositive ? 'positive' : 'negative';
        const ChangeIcon = change === 0 ? Minus : change > 0 ? TrendingUp : TrendingDown;

        return (
          <div key={card.label} className={`kpi-card ${card.type}`}>
            <div className="kpi-header">
              <span className="kpi-label">{card.label}</span>
              <div className={`kpi-icon ${card.type}`}>
                <card.icon size={22} />
              </div>
            </div>
            <div className="kpi-value">
              {card.isPercent
                ? `${card.value.toFixed(1)}%`
                : formatINRCompact(card.value)}
            </div>
            <span className={`kpi-change ${changeClass}`}>
              <ChangeIcon size={14} />
              {Math.abs(change).toFixed(1)}% vs prev
            </span>
          </div>
        );
      })}
    </div>
  );
}
