import { RotateCcw, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  EXPENSE_CATEGORIES,
  REVENUE_CATEGORIES,
  type DatePreset,
} from '../../types';

export default function FilterBar() {
  const { state, setFilters, resetFilters } = useApp();
  const f = state.filters;

  const employees = Array.from(new Set(state.expenses.map((e) => e.paidBy))).sort();

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <div className="filter-group">
          <label>Period</label>
          <select
            value={f.datePreset}
            onChange={(e) => setFilters({ datePreset: e.target.value as DatePreset })}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {f.datePreset === 'custom' && (
          <>
            <div className="filter-group">
              <label>From</label>
              <input
                type="date"
                value={f.startDate}
                onChange={(e) => setFilters({ startDate: e.target.value })}
              />
            </div>
            <div className="filter-group">
              <label>To</label>
              <input
                type="date"
                value={f.endDate}
                onChange={(e) => setFilters({ endDate: e.target.value })}
              />
            </div>
          </>
        )}

        <div className="filter-group">
          <label>Expense Category</label>
          <select
            value={f.expenseCategory}
            onChange={(e) => setFilters({ expenseCategory: e.target.value as any })}
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Revenue Source</label>
          <select
            value={f.revenueCategory}
            onChange={(e) => setFilters({ revenueCategory: e.target.value as any })}
          >
            <option value="all">All Sources</option>
            {REVENUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Payment Status</label>
          <select
            value={f.paymentStatus}
            onChange={(e) => setFilters({ paymentStatus: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Received">Received</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Partially Received">Partially Received</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Employee</label>
          <select
            value={f.employee}
            onChange={(e) => setFilters({ employee: e.target.value })}
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp} value={emp}>
                {emp}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ minWidth: 200 }}>
          <label>Search</label>
          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={f.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
            />
          </div>
        </div>

        <button className="btn btn-outline btn-sm" onClick={resetFilters} style={{ marginTop: 'auto' }}>
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  );
}
