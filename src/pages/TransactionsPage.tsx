import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import FilterBar from '../components/dashboard/FilterBar';
import { filterExpenses, filterRevenue, formatINR, formatDate, sortByField, type SortDirection } from '../utils/helpers';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'Expense' | 'Revenue';
  category: string;
  amount: number;
  paymentStatus: string;
  paymentMethod: string;
}

export default function TransactionsPage() {
  const { state } = useApp();
  const [sortField, setSortField] = useState<keyof Transaction>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const transactions: Transaction[] = useMemo(() => {
    const filteredExpenses = filterExpenses(state.expenses, state.filters);
    const filteredRevenues = filterRevenue(state.revenues, state.filters);
    return [
      ...filteredExpenses.map((e) => ({
        id: e.id, date: e.date, description: e.title, type: 'Expense' as const,
        category: e.category, amount: e.amount, paymentStatus: e.paymentStatus, paymentMethod: e.paymentMethod,
      })),
      ...filteredRevenues.map((r) => ({
        id: r.id, date: r.date, description: r.source, type: 'Revenue' as const,
        category: r.category, amount: r.amount, paymentStatus: r.paymentStatus, paymentMethod: r.paymentMethod,
      })),
    ];
  }, [state.expenses, state.revenues, state.filters]);

  const sorted = useMemo(() => sortByField(transactions, sortField, sortDir), [transactions, sortField, sortDir]);

  const [page, setPage] = useState(1);
  const perPage = 15;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageData = sorted.slice((page - 1) * perPage, page * perPage);

  function handleSort(field: keyof Transaction) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const SortIcon = ({ field }: { field: keyof Transaction }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  function getStatusClass(status: string) {
    if (status === 'Paid' || status === 'Received') return 'paid';
    if (status === 'Pending') return 'pending';
    return 'partial';
  }

  const totalRevenue = sorted.filter((t) => t.type === 'Revenue').reduce((s, t) => s + t.amount, 0);
  const totalExpense = sorted.filter((t) => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>All Transactions</h2>
      <FilterBar />

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ padding: '12px 20px', background: 'var(--color-success-bg)', borderRadius: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Revenue</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>{formatINR(totalRevenue)}</div>
        </div>
        <div style={{ padding: '12px 20px', background: 'var(--color-danger-bg)', borderRadius: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Expenses</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-danger)', marginTop: 4 }}>{formatINR(totalExpense)}</div>
        </div>
        <div style={{ padding: '12px 20px', background: '#eef2ff', borderRadius: 12, flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Net</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>{formatINR(totalRevenue - totalExpense)}</div>
        </div>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} className={sortField === 'date' ? 'sorted' : ''}>Date <SortIcon field="date" /></th>
                <th>ID</th>
                <th onClick={() => handleSort('description')} className={sortField === 'description' ? 'sorted' : ''}>Description <SortIcon field="description" /></th>
                <th onClick={() => handleSort('type')} className={sortField === 'type' ? 'sorted' : ''}>Type <SortIcon field="type" /></th>
                <th onClick={() => handleSort('category')} className={sortField === 'category' ? 'sorted' : ''}>Category <SortIcon field="category" /></th>
                <th>Payment</th>
                <th>Status</th>
                <th onClick={() => handleSort('amount')} className={sortField === 'amount' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Amount <SortIcon field="amount" /></th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>{t.id}</td>
                  <td style={{ fontWeight: 500 }}>{t.description}</td>
                  <td>
                    <span className={`status-badge ${t.type === 'Revenue' ? 'received' : 'pending'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>{t.category}</td>
                  <td>{t.paymentMethod}</td>
                  <td><span className={`status-badge ${getStatusClass(t.paymentStatus)}`}>{t.paymentStatus}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: t.type === 'Revenue' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {t.type === 'Expense' ? '-' : '+'}{formatINR(t.amount)}
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, sorted.length)} of {sorted.length}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

