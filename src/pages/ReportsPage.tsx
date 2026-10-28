import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { type ReportPeriod } from '../types';
import {
  formatINR,
  calcTotalRevenue,
  calcTotalExpenses,
  calcNetProfit,
  calcProfitMargin,
  calcCashInflow,
  calcCashOutflow,
  getMonthName,
} from '../utils/helpers';
import { parseISO } from 'date-fns';
import { FileBarChart2, Download } from 'lucide-react';

export default function ReportsPage() {
  const { state } = useApp();
  const [period, setPeriod] = useState<ReportPeriod>('monthly');

  const reportData = useMemo(() => {
    const groups = new Map<string, { revenues: typeof state.revenues; expenses: typeof state.expenses }>();

    // Group by period
    state.revenues.forEach((r) => {
      const d = parseISO(r.date);
      let key: string;
      if (period === 'monthly') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      else if (period === 'quarterly') key = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
      else key = `${d.getFullYear()}`;
      if (!groups.has(key)) groups.set(key, { revenues: [], expenses: [] });
      groups.get(key)!.revenues.push(r);
    });

    state.expenses.forEach((e) => {
      const d = parseISO(e.date);
      let key: string;
      if (period === 'monthly') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      else if (period === 'quarterly') key = `${d.getFullYear()}-Q${Math.ceil((d.getMonth() + 1) / 3)}`;
      else key = `${d.getFullYear()}`;
      if (!groups.has(key)) groups.set(key, { revenues: [], expenses: [] });
      groups.get(key)!.expenses.push(e);
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => {
        const revenue = calcTotalRevenue(data.revenues);
        const expenses = calcTotalExpenses(data.expenses);
        const profit = calcNetProfit(revenue, expenses);
        const profitMargin = calcProfitMargin(profit, revenue);
        const cashInflow = calcCashInflow(data.revenues);
        const cashOutflow = calcCashOutflow(data.expenses);

        // Format period label
        let label = key;
        if (period === 'monthly') {
          const [y, m] = key.split('-');
          label = `${getMonthName(parseInt(m) - 1)} ${y}`;
        }

        // Top categories
        const expCatMap = new Map<string, number>();
        data.expenses.forEach((e) => expCatMap.set(e.category, (expCatMap.get(e.category) || 0) + e.amount));
        const topExpenseCategories = Array.from(expCatMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([category, amount]) => ({ category, amount }));

        const revSrcMap = new Map<string, number>();
        data.revenues.forEach((r) => revSrcMap.set(r.category, (revSrcMap.get(r.category) || 0) + r.amount));
        const topRevenueSources = Array.from(revSrcMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([source, amount]) => ({ source, amount }));

        return {
          period: label,
          revenue,
          expenses,
          profit,
          profitMargin,
          cashInflow,
          cashOutflow,
          cashFlow: cashInflow - cashOutflow,
          topExpenseCategories,
          topRevenueSources,
        };
      });
  }, [state.expenses, state.revenues, period]);

  // Grand totals
  const totals = useMemo(() => {
    const revenue = reportData.reduce((s, r) => s + r.revenue, 0);
    const expenses = reportData.reduce((s, r) => s + r.expenses, 0);
    const profit = revenue - expenses;
    return { revenue, expenses, profit, profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0 };
  }, [reportData]);

  function exportCSV() {
    const headers = ['Period', 'Revenue', 'Expenses', 'Profit', 'Profit Margin %', 'Cash Inflow', 'Cash Outflow', 'Cash Flow'];
    const rows = reportData.map((r) => [
      r.period, r.revenue, r.expenses, r.profit, r.profitMargin.toFixed(1),
      r.cashInflow, r.cashOutflow, r.cashFlow,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileBarChart2 size={28} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Financial Reports</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['monthly', 'quarterly', 'yearly'] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button className="btn btn-sm btn-outline" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Revenue</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)', marginTop: 8 }}>{formatINR(totals.revenue)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Total Expenses</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-danger)', marginTop: 8 }}>{formatINR(totals.expenses)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Net Profit</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: totals.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: 8 }}>{formatINR(totals.profit)}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Avg Profit Margin</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', marginTop: 8 }}>{totals.profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Report Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{period.charAt(0).toUpperCase() + period.slice(1)} Breakdown</h3>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
                <th style={{ textAlign: 'right' }}>Expenses</th>
                <th style={{ textAlign: 'right' }}>Profit</th>
                <th style={{ textAlign: 'right' }}>Margin</th>
                <th style={{ textAlign: 'right' }}>Cash Inflow</th>
                <th style={{ textAlign: 'right' }}>Cash Outflow</th>
                <th style={{ textAlign: 'right' }}>Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((r) => (
                <tr key={r.period}>
                  <td style={{ fontWeight: 600 }}>{r.period}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>{formatINR(r.revenue)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-danger)' }}>{formatINR(r.expenses)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: r.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatINR(r.profit)}</td>
                  <td style={{ textAlign: 'right' }}>{r.profitMargin.toFixed(1)}%</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(r.cashInflow)}</td>
                  <td style={{ textAlign: 'right' }}>{formatINR(r.cashOutflow)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: r.cashFlow >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatINR(r.cashFlow)}</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

