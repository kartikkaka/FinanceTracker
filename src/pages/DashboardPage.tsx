import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import KPICards from '../components/dashboard/KPICards';
import FilterBar from '../components/dashboard/FilterBar';
import type {
  KPIData,
} from '../types';
import {
  filterExpenses,
  filterRevenue,
  calcTotalRevenue,
  calcTotalExpenses,
  calcNetProfit,
  calcProfitMargin,
  calcCashInflow,
  calcCashOutflow,
  calcPendingPayments,
  getPreviousDateRange,
  formatINR,
  getMonthName,
} from '../utils/helpers';
import { parseISO, isWithinInterval } from 'date-fns';

export default function DashboardPage() {
  const { state } = useApp();

  const filteredExpenses = useMemo(() => filterExpenses(state.expenses, state.filters), [state.expenses, state.filters]);
  const filteredRevenues = useMemo(() => filterRevenue(state.revenues, state.filters), [state.revenues, state.filters]);

  const kpiData: KPIData = useMemo(() => {
    const totalRevenue = calcTotalRevenue(filteredRevenues);
    const totalExpenses = calcTotalExpenses(filteredExpenses);
    const netProfit = calcNetProfit(totalRevenue, totalExpenses);
    const profitMargin = calcProfitMargin(netProfit, totalRevenue);
    const pendingPayments = calcPendingPayments(filteredRevenues, filteredExpenses);
    const cashInflow = calcCashInflow(filteredRevenues);
    const cashOutflow = calcCashOutflow(filteredExpenses);
    const cashFlow = cashInflow - cashOutflow;

    // Current month data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyRevenue = filteredRevenues
      .filter((r) => { const d = parseISO(r.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
      .reduce((s, r) => s + r.amount, 0);
    const monthlyExpenses = filteredExpenses
      .filter((e) => { const d = parseISO(e.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
      .reduce((s, e) => s + e.amount, 0);

    // Previous period data
    const prevRange = getPreviousDateRange(state.filters.datePreset, state.filters.startDate, state.filters.endDate);
    const prevExpenses = state.expenses.filter((e) => isWithinInterval(parseISO(e.date), prevRange));
    const prevRevenues = state.revenues.filter((r) => isWithinInterval(parseISO(r.date), prevRange));
    const prevTotalRevenue = calcTotalRevenue(prevRevenues);
    const prevTotalExpenses = calcTotalExpenses(prevExpenses);
    const prevNetProfit = calcNetProfit(prevTotalRevenue, prevTotalExpenses);
    const prevProfitMargin = calcProfitMargin(prevNetProfit, prevTotalRevenue);
    const prevPendingPayments = calcPendingPayments(prevRevenues, prevExpenses);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthlyRevenue = state.revenues
      .filter((r) => { const d = parseISO(r.date); return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear; })
      .reduce((s, r) => s + r.amount, 0);
    const prevMonthlyExpenses = state.expenses
      .filter((e) => { const d = parseISO(e.date); return d.getMonth() === prevMonth && d.getFullYear() === prevMonthYear; })
      .reduce((s, e) => s + e.amount, 0);

    return {
      totalRevenue, totalExpenses, netProfit, profitMargin, pendingPayments,
      monthlyRevenue, monthlyExpenses,
      prevTotalRevenue, prevTotalExpenses, prevNetProfit, prevProfitMargin, prevPendingPayments,
      prevMonthlyRevenue, prevMonthlyExpenses,
      cashInflow, cashOutflow, cashFlow,
    };
  }, [filteredExpenses, filteredRevenues, state.expenses, state.revenues, state.filters]);

  // Top expense categories
  const topExpenseCategories = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredExpenses]);

  // Top revenue sources
  const topRevenueSources = useMemo(() => {
    const map = new Map<string, number>();
    filteredRevenues.forEach((r) => map.set(r.category, (map.get(r.category) || 0) + r.amount));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredRevenues]);

  return (
    <div>
      <FilterBar />
      <KPICards data={kpiData} />

      <div className="charts-grid">
        {/* Cash Flow Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Cash Flow Summary</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Cash Inflow</span>
                <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatINR(kpiData.cashInflow)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Cash Outflow</span>
                <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{formatINR(kpiData.cashOutflow)}</span>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Net Cash Flow</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: kpiData.cashFlow >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {formatINR(kpiData.cashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Expense Categories */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Expense Categories</h3>
          </div>
          <div className="card-body">
            {topExpenseCategories.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>No expense data</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topExpenseCategories.map(([cat, amount]) => {
                  const total = calcTotalExpenses(filteredExpenses);
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span>{cat}</span>
                        <span style={{ fontWeight: 600 }}>{formatINR(amount)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-danger-light)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Revenue Sources */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Revenue Sources</h3>
          </div>
          <div className="card-body">
            {topRevenueSources.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>No revenue data</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topRevenueSources.map(([cat, amount]) => {
                  const total = calcTotalRevenue(filteredRevenues);
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span>{cat}</span>
                        <span style={{ fontWeight: 600 }}>{formatINR(amount)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-success-light)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...filteredExpenses.map((e) => ({ date: e.date, desc: e.title, type: 'Expense' as const, amount: e.amount })),
                    ...filteredRevenues.map((r) => ({ date: r.date, desc: r.source, type: 'Revenue' as const, amount: r.amount })),
                  ]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 8)
                    .map((t, i) => (
                      <tr key={i}>
                        <td>{t.date}</td>
                        <td>{t.desc}</td>
                        <td>
                          <span className={`status-badge ${t.type === 'Revenue' ? 'received' : 'pending'}`}>
                            {t.type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: t.type === 'Revenue' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {t.type === 'Expense' ? '-' : '+'}{formatINR(t.amount)}
                        </td>
                      </tr>
                    ))}
                  {filteredExpenses.length === 0 && filteredRevenues.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
