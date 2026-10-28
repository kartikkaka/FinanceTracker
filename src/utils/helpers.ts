import type { Filters, DatePreset, Expense, Revenue } from '../types';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths,
  parseISO, isWithinInterval, format
} from 'date-fns';

// ─── Indian Rupee Formatter ──────────────────────────────────────────────────

export function formatINR(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(amount);
  const parts = abs.toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];
  
  // Indian numbering: last 3 digits, then groups of 2
  let result = '';
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    const last3 = intPart.slice(-3);
    let remaining = intPart.slice(0, -3);
    const groups: string[] = [];
    while (remaining.length > 2) {
      groups.unshift(remaining.slice(-2));
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) groups.unshift(remaining);
    result = groups.join(',') + ',' + last3;
  }
  
  return `${isNeg ? '-' : ''}₹${result}.${decPart}`;
}

export function formatINRCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return formatINR(amount);
}

// ─── Percentage Change ───────────────────────────────────────────────────────

export function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// ─── Date Range Helpers ──────────────────────────────────────────────────────

export function getDateRangeFromPreset(preset: DatePreset, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'this_week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'this_month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month': {
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    case 'this_quarter':
      return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case 'this_year':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'custom':
      return {
        start: customStart ? parseISO(customStart) : startOfYear(now),
        end: customEnd ? parseISO(customEnd) : endOfDay(now),
      };
    case 'all':
    default:
      return { start: new Date(2020, 0, 1), end: endOfDay(now) };
  }
}

export function getPreviousDateRange(preset: DatePreset, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const { start, end } = getDateRangeFromPreset(preset, customStart, customEnd);
  const duration = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - duration),
    end: new Date(start.getTime() - 1),
  };
}

// ─── Filter Helpers ──────────────────────────────────────────────────────────

export function filterExpenses(expenses: Expense[], filters: Filters): Expense[] {
  const { start, end } = getDateRangeFromPreset(filters.datePreset, filters.startDate, filters.endDate);

  return expenses.filter((e) => {
    const d = parseISO(e.date);
    if (!isWithinInterval(d, { start, end })) return false;
    if (filters.expenseCategory !== 'all' && e.category !== filters.expenseCategory) return false;
    if (filters.paymentStatus && filters.paymentStatus !== 'all' && e.paymentStatus !== filters.paymentStatus) return false;
    if (filters.employee && filters.employee !== 'all' && e.paidBy !== filters.employee) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) &&
        !e.description.toLowerCase().includes(q) &&
        !e.vendorName.toLowerCase().includes(q) &&
        !e.id.toLowerCase().includes(q) &&
        !e.paidBy.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

export function filterRevenue(revenues: Revenue[], filters: Filters): Revenue[] {
  const { start, end } = getDateRangeFromPreset(filters.datePreset, filters.startDate, filters.endDate);

  return revenues.filter((r) => {
    const d = parseISO(r.date);
    if (!isWithinInterval(d, { start, end })) return false;
    if (filters.revenueCategory !== 'all' && r.category !== filters.revenueCategory) return false;
    if (filters.paymentStatus && filters.paymentStatus !== 'all' && r.paymentStatus !== filters.paymentStatus) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (
        !r.source.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q) &&
        !r.clientName.toLowerCase().includes(q) &&
        !r.id.toLowerCase().includes(q) &&
        !r.invoiceNumber.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

// ─── Financial Calculations ──────────────────────────────────────────────────

export function calcTotalRevenue(revenues: Revenue[]): number {
  return revenues.reduce((sum, r) => sum + r.amount, 0);
}

export function calcTotalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function calcNetProfit(revenue: number, expenses: number): number {
  return revenue - expenses;
}

export function calcProfitMargin(profit: number, revenue: number): number {
  if (revenue <= 0) return 0;
  return (profit / revenue) * 100;
}

export function calcCashInflow(revenues: Revenue[]): number {
  return revenues.reduce((sum, r) => {
    if (r.paymentStatus === 'Received') return sum + r.amount;
    if (r.paymentStatus === 'Partially Received') return sum + r.receivedAmount;
    return sum;
  }, 0);
}

export function calcCashOutflow(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => {
    if (e.paymentStatus === 'Paid') return sum + e.amount;
    if (e.paymentStatus === 'Partially Paid') return sum + e.paidAmount;
    return sum;
  }, 0);
}

export function calcPendingPayments(revenues: Revenue[], expenses: Expense[]): number {
  const pendingReceivable = revenues.reduce((sum, r) => {
    if (r.paymentStatus === 'Pending') return sum + r.amount;
    if (r.paymentStatus === 'Partially Received') return sum + (r.amount - r.receivedAmount);
    return sum;
  }, 0);
  const pendingPayable = expenses.reduce((sum, e) => {
    if (e.paymentStatus === 'Pending') return sum + e.amount;
    if (e.paymentStatus === 'Partially Paid') return sum + (e.amount - e.paidAmount);
    return sum;
  }, 0);
  return pendingReceivable + pendingPayable;
}

// ─── ID Generator ────────────────────────────────────────────────────────────

let counter = 0;
export function generateId(prefix: string): string {
  counter++;
  const now = new Date();
  const ts = format(now, 'yyyyMMdd');
  return `${prefix}-${ts}-${String(counter).padStart(4, '0')}`;
}

// ─── Sorting Helper ──────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export function sortByField<T>(arr: T[], field: keyof T, dir: SortDirection): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return dir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });
}

// ─── Date formatter for India ────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yy');
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateExpense(expense: Partial<Expense>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!expense.title?.trim()) errors.title = 'Title is required';
  if (!expense.date) errors.date = 'Date is required';
  if (!expense.amount || expense.amount <= 0) errors.amount = 'Amount must be greater than 0';
  if (!expense.category) errors.category = 'Category is required';
  if (!expense.paymentMethod) errors.paymentMethod = 'Payment method is required';
  if (!expense.paymentStatus) errors.paymentStatus = 'Payment status is required';
  if (expense.paymentStatus === 'Partially Paid') {
    if (!expense.paidAmount || expense.paidAmount <= 0) errors.paidAmount = 'Paid amount must be greater than 0';
    if (expense.paidAmount && expense.amount && expense.paidAmount >= expense.amount) errors.paidAmount = 'Paid amount must be less than total amount';
  }
  return errors;
}

export function validateRevenue(revenue: Partial<Revenue>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!revenue.source?.trim()) errors.source = 'Revenue source is required';
  if (!revenue.date) errors.date = 'Date is required';
  if (!revenue.amount || revenue.amount <= 0) errors.amount = 'Amount must be greater than 0';
  if (!revenue.category) errors.category = 'Category is required';
  if (!revenue.paymentMethod) errors.paymentMethod = 'Payment method is required';
  if (!revenue.paymentStatus) errors.paymentStatus = 'Payment status is required';
  if (revenue.paymentStatus === 'Partially Received') {
    if (!revenue.receivedAmount || revenue.receivedAmount <= 0) errors.receivedAmount = 'Received amount must be greater than 0';
    if (revenue.receivedAmount && revenue.amount && revenue.receivedAmount >= revenue.amount) errors.receivedAmount = 'Received amount must be less than total amount';
  }
  return errors;
}

// ─── Month name helper ───────────────────────────────────────────────────────

export function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month] || '';
}
