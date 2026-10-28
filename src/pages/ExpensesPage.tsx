import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  type Expense,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  EXPENSE_PAYMENT_STATUSES,
} from '../types';
import {
  filterExpenses,
  formatINR,
  formatDate,
  generateId,
  sortByField,
  validateExpense,
  type SortDirection,
} from '../utils/helpers';
import { Plus, Edit2, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function ExpensesPage() {
  const { state, addExpense, updateExpense, deleteExpense } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [sortField, setSortField] = useState<keyof Expense>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => filterExpenses(state.expenses, state.filters), [state.expenses, state.filters]);
  const sorted = useMemo(() => sortByField(filtered, sortField, sortDir), [filtered, sortField, sortDir]);

  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageData = sorted.slice((page - 1) * perPage, page * perPage);

  const blankExpense: Partial<Expense> = {
    title: '', date: new Date().toISOString().split('T')[0], category: 'Miscellaneous',
    description: '', amount: 0, paidAmount: 0, paymentMethod: 'Bank Transfer',
    paidBy: '', vendorName: '', paymentStatus: 'Paid',
  };
  const [form, setForm] = useState<Partial<Expense>>(blankExpense);

  function openNew() {
    setEditItem(null);
    setForm(blankExpense);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(exp: Expense) {
    setEditItem(exp);
    setForm({ ...exp });
    setErrors({});
    setShowModal(true);
  }

  function handleSubmit() {
    const errs = validateExpense(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const now = new Date().toISOString();
    if (editItem) {
      updateExpense({ ...editItem, ...form, updatedAt: now } as Expense);
    } else {
      addExpense({ ...form, id: generateId('EXP'), createdAt: now, updatedAt: now } as Expense);
    }
    setShowModal(false);
  }

  function handleSort(field: keyof Expense) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const SortIcon = ({ field }: { field: keyof Expense }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  function getStatusClass(status: string) {
    if (status === 'Paid') return 'paid';
    if (status === 'Pending') return 'pending';
    return 'partial';
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Expenses</h2>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Add Expense</button>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} className={sortField === 'date' ? 'sorted' : ''}>Date <SortIcon field="date" /></th>
                <th onClick={() => handleSort('title')} className={sortField === 'title' ? 'sorted' : ''}>Title <SortIcon field="title" /></th>
                <th onClick={() => handleSort('category')} className={sortField === 'category' ? 'sorted' : ''}>Category <SortIcon field="category" /></th>
                <th onClick={() => handleSort('amount')} className={sortField === 'amount' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Amount <SortIcon field="amount" /></th>
                <th>Paid By</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((exp) => (
                <tr key={exp.id}>
                  <td>{formatDate(exp.date)}</td>
                  <td style={{ fontWeight: 500 }}>{exp.title}</td>
                  <td>{exp.category}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-danger)' }}>{formatINR(exp.amount)}</td>
                  <td>{exp.paidBy}</td>
                  <td><span className={`status-badge ${getStatusClass(exp.paymentStatus)}`}>{exp.paymentStatus}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(exp)} title="Edit"><Edit2 size={16} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => deleteExpense(exp.id)} title="Delete" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No expenses found</td></tr>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editItem ? 'Edit Expense' : 'Add Expense'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className={`form-input ${errors.title ? 'error' : ''}`} value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  {errors.title && <span className="form-error">{errors.title}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className={`form-input ${errors.date ? 'error' : ''}`} value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  {errors.date && <span className="form-error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className={`form-select ${errors.category ? 'error' : ''}`} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className={`form-input ${errors.amount ? 'error' : ''}`} value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                  {errors.amount && <span className="form-error">{errors.amount}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method *</label>
                  <select className="form-select" value={form.paymentMethod || ''} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Status *</label>
                  <select className="form-select" value={form.paymentStatus || ''} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as any })}>
                    {EXPENSE_PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {form.paymentStatus === 'Partially Paid' && (
                  <div className="form-group">
                    <label className="form-label">Paid Amount (₹) *</label>
                    <input type="number" className={`form-input ${errors.paidAmount ? 'error' : ''}`} value={form.paidAmount || ''} onChange={(e) => setForm({ ...form, paidAmount: Number(e.target.value) })} />
                    {errors.paidAmount && <span className="form-error">{errors.paidAmount}</span>}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Paid By</label>
                  <input className="form-input" value={form.paidBy || ''} onChange={(e) => setForm({ ...form, paidBy: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor Name</label>
                  <input className="form-input" value={form.vendorName || ''} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editItem ? 'Update' : 'Add'} Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
