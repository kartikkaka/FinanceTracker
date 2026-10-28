import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { sampleExpenses, sampleRevenues } from '../data/sampleData';
import { Settings, Database, Trash2, RefreshCw, Save } from 'lucide-react';

export default function SettingsPage() {
  const { state, dispatch, notify } = useApp();
  const [companyName, setCompanyName] = useState(state.settings.companyName);
  const [currency, setCurrency] = useState(state.settings.currency);
  const [fyStart, setFyStart] = useState(state.settings.financialYearStart);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function handleSave() {
    dispatch({
      type: 'SET_SETTINGS',
      payload: { companyName, currency, financialYearStart: fyStart },
    });
    notify('success', 'Settings saved successfully');
  }

  function handleClearData() {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      dispatch({ type: 'CLEAR_ALL_DATA' });
      notify('info', 'All data has been cleared');
    }
  }

  function handleLoadSample() {
    if (window.confirm('This will add sample data. Continue?')) {
      dispatch({ type: 'LOAD_SAMPLE_DATA' });
      notify('success', 'Sample data loaded successfully');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Settings size={28} style={{ color: 'var(--color-primary)' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Settings</h2>
      </div>

      <div style={{ display: 'grid', gap: 24, maxWidth: 800 }}>
        {/* Company Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Company Information</h3>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input
                  className="form-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Financial Year Starts</label>
                <select className="form-select" value={fyStart} onChange={(e) => setFyStart(Number(e.target.value))}>
                  {months.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={handleSave} style={{ marginTop: 8 }}>
              <Save size={16} /> Save Settings
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Data Management</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#f8fafc', borderRadius: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Current Data</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {state.expenses.length} expenses • {state.revenues.length} revenue entries
                  </div>
                </div>
                <Database size={24} style={{ color: 'var(--color-text-muted)' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={handleLoadSample}>
                  <RefreshCw size={16} /> Load Sample Data
                </button>
                <button className="btn btn-danger" onClick={handleClearData}>
                  <Trash2 size={16} /> Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">About FinTrack</h3>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              <p><strong>FinTrack</strong> — Indian Business Finance Dashboard</p>
              <p>Version 1.0 • All data is stored locally in your browser.</p>
              <p style={{ marginTop: 8 }}>
                Features: Expense & Revenue tracking, KPI dashboard, financial reports with CSV export,
                Indian Rupee formatting with Lakhs & Crores.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

