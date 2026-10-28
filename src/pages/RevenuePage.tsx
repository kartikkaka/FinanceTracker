import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  type Revenue,
  REVENUE_CATEGORIES,
  PAYMENT_METHODS,
  REVENUE_PAYMENT_STATUSES,
} from '../types';
import {
  filterRevenue,
  formatINR,
  formatDate,
  generateId,
  sortByField,
  validateRevenue,
  type SortDirection,
} from '../utils/helpers';
import { Plus, Edit2, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function RevenuePage() {
  const { state, addRevenue, updateRevenue, deleteRevenue } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Revenue | null>(null);
  const [sortField, setSortField] = useState<keyof Revenue>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => filterRevenue(state.revenues, state.filters), [state.revenues, state.filters]);
  const sorted = useMemo(() => sortByField(filtered, sortField, sortDir), [filtered, sortField, sortDir]);

  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageData = sorted.slice((page - 1) * perPage, page * perPage);

  const blankRevenue: Partial<Revenue> = {
    source: '', date: new Date().toISOString().split('T')[0], category: 'Product Sales',
    description: '', amount: 0, receivedAmount: 0, paymentMethod: 'Bank Transfer',
    clientName: '', invoiceNumber: '', paymentStatus: 'Received',
    expectedPaymentDate: new Date().toISOString().split('T')[0],
  };
  const [form, setForm] = useState<Partial<Revenue>>(blankRevenue);

  function openNew() {
    setEditItem(null);
    setForm(blankRevenue);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(rev: Revenue) {
    setEditItem(rev);
    setForm({ ...rev });
    setErrors({});
    setShowModal(true);
  }

  function handleSubmit() {
    const errs = validateRevenue(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    const now = new Date().toISOString();
    if (editItem) {
      updateRevenue({ ...editItem, ...form, updatedAt: now } as Revenue);
    } else {
      addRevenue({ ...form, id: generateId('REV'), createdAt: now, updatedAt: now } as Revenue);
    }
    setShowModal(false);
  }

  function handleSort(field: keyof Revenue) {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const SortIcon = ({ field }: { field: keyof Revenue }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  function getStatusClass(status: string) {
    if (status === 'Received') return 'received';
    if (status === 'Pending') return 'pending';
    return 'partial';
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Revenue</h2>
        <button className="btn btn-success" onClick={openNew}><Plus size={18} /> Add Revenue</button>
      </div>

      <div className="card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} className={sortField === 'date' ? 'sorted' : ''}>Date <SortIcon field="date" /></th>
                <th onClick={() => handleSort('source')} className={sortField === 'source' ? 'sorted' : ''}>Source <SortIcon field="source" /></th>
                <th>Client</th>
                <th onClick={() => handleSort('category')} className={sortField === 'category' ? 'sorted' : ''}>Category <SortIcon field="category" /></th>
                <th onClick={() => handleSort('amount')} className={sortField === 'amount' ? 'sorted' : ''} style={{ textAlign: 'right' }}>Amount <SortIcon field="amount" /></th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((rev) => (
                <tr key={rev.id}>
                  <td>{formatDate(rev.date)}</td>
                  <td style={{ fontWeight: 500 }}>{rev.source}</td>
                  <td>{rev.clientName}</td>
                  <td>{rev.category}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-success)' }}>{formatINR(rev.amount)}</td>
                  <td><span className={`status-badge ${getStatusClass(rev.paymentStatus)}`}>{rev.paymentStatus}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(rev)} title="Edit"><Edit2 size={16} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => deleteRevenue(rev.id)} title="Delete" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {pageData.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No revenue entries found</td></tr>
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
              <h3 className="modal-title">{editItem ? 'Edit Revenue' : 'Add Revenue'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Revenue Source *</label>
                  <input className={`form-input ${errors.source ? 'error' : ''}`} value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                  {errors.source && <span className="form-error">{errors.source}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className={`form-input ${errors.date ? 'error' : ''}`} value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  {errors.date && <span className="form-error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className={`form-select ${errors.category ? 'error' : ''}`} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value as any })}>
                    {REVENUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className={`form-input ${errors.amount ? 'error' : ''}`} value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                  {errors.amount && <span className="form-error">{errors.amount}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <input className="form-input" value={form.clientName || ''} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Invoice Number</label>
                  <input className="form-input" value={form.invoiceNumber || ''} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
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
                    {REVENUE_PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {form.paymentStatus === 'Partially Received' && (
                  <div className="form-group">
                    <label className="form-label">Received Amount (₹) *</label>
                    <input type="number" className={`form-input ${errors.receivedAmount ? 'error' : ''}`} value={form.receivedAmount || ''} onChange={(e) => setForm({ ...form, receivedAmount: Number(e.target.value) })} />
                    {errors.receivedAmount && <span className="form-error">{errors.receivedAmount}</span>}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Expected Payment Date</label>
                  <input type="date" className="form-input" value={form.expectedPaymentDate || ''} onChange={(e) => setForm({ ...form, expectedPaymentDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-success" onClick={handleSubmit}>{editItem ? 'Update' : 'Add'} Revenue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
