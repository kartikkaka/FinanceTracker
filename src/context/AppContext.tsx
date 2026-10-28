import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { Expense, Revenue, Filters, AppSettings } from '../types';
import { sampleExpenses, sampleRevenues } from '../data/sampleData';

// ─── State ───────────────────────────────────────────────────────────────────

interface AppState {
  expenses: Expense[];
  revenues: Revenue[];
  filters: Filters;
  settings: AppSettings;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
}

const defaultFilters: Filters = {
  datePreset: 'this_year',
  startDate: '',
  endDate: '',
  expenseCategory: 'all',
  revenueCategory: 'all',
  paymentStatus: 'all',
  employee: 'all',
  searchQuery: '',
};

const defaultSettings: AppSettings = {
  companyName: 'TechVista Solutions Pvt Ltd',
  currency: 'INR',
  financialYearStart: 3, // April
  theme: 'light',
};

function loadState(): AppState {
  try {
    const saved = localStorage.getItem('fintrack_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        expenses: parsed.expenses || [],
        revenues: parsed.revenues || [],
        filters: defaultFilters,
        settings: parsed.settings || defaultSettings,
        notification: null,
      };
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  // First time: load sample data
  return {
    expenses: sampleExpenses,
    revenues: sampleRevenues,
    filters: defaultFilters,
    settings: defaultSettings,
    notification: null,
  };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'ADD_REVENUE'; payload: Revenue }
  | { type: 'UPDATE_REVENUE'; payload: Revenue }
  | { type: 'DELETE_REVENUE'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<Filters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'LOAD_SAMPLE_DATA' }
  | { type: 'SET_NOTIFICATION'; payload: AppState['notification'] }
  | { type: 'CLEAR_NOTIFICATION' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) => (e.id === action.payload.id ? action.payload : e)),
      };
    case 'DELETE_EXPENSE':
      return { ...state, expenses: state.expenses.filter((e) => e.id !== action.payload) };
    case 'ADD_REVENUE':
      return { ...state, revenues: [action.payload, ...state.revenues] };
    case 'UPDATE_REVENUE':
      return {
        ...state,
        revenues: state.revenues.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
    case 'DELETE_REVENUE':
      return { ...state, revenues: state.revenues.filter((r) => r.id !== action.payload) };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'RESET_FILTERS':
      return { ...state, filters: defaultFilters };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'CLEAR_ALL_DATA':
      return { ...state, expenses: [], revenues: [] };
    case 'LOAD_SAMPLE_DATA':
      return { ...state, expenses: sampleExpenses, revenues: sampleRevenues };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addRevenue: (revenue: Revenue) => void;
  updateRevenue: (revenue: Revenue) => void;
  deleteRevenue: (id: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'fintrack_data',
        JSON.stringify({
          expenses: state.expenses,
          revenues: state.revenues,
          settings: state.settings,
        })
      );
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [state.expenses, state.revenues, state.settings]);

  // Auto-clear notifications
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [state.notification]);

  const notify = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    dispatch({ type: 'SET_NOTIFICATION', payload: { type, message } });
  }, []);

  const addExpense = useCallback((expense: Expense) => {
    dispatch({ type: 'ADD_EXPENSE', payload: expense });
    notify('success', 'Expense added successfully');
  }, [notify]);

  const updateExpense = useCallback((expense: Expense) => {
    dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
    notify('success', 'Expense updated successfully');
  }, [notify]);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
    notify('success', 'Expense deleted successfully');
  }, [notify]);

  const addRevenue = useCallback((revenue: Revenue) => {
    dispatch({ type: 'ADD_REVENUE', payload: revenue });
    notify('success', 'Revenue added successfully');
  }, [notify]);

  const updateRevenue = useCallback((revenue: Revenue) => {
    dispatch({ type: 'UPDATE_REVENUE', payload: revenue });
    notify('success', 'Revenue updated successfully');
  }, [notify]);

  const deleteRevenue = useCallback((id: string) => {
    dispatch({ type: 'DELETE_REVENUE', payload: id });
    notify('success', 'Revenue deleted successfully');
  }, [notify]);

  const setFilters = useCallback((filters: Partial<Filters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET_FILTERS' });
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addExpense,
        updateExpense,
        deleteExpense,
        addRevenue,
        updateRevenue,
        deleteRevenue,
        setFilters,
        resetFilters,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
