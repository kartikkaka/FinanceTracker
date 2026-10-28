// ─── Expense Types ───────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'Salaries & Wages'
  | 'Office Rent'
  | 'Travel & Transportation'
  | 'Food & Accommodation'
  | 'Marketing & Advertising'
  | 'Software & Subscriptions'
  | 'Internet & Utilities'
  | 'Training & Education'
  | 'Equipment & Supplies'
  | 'Miscellaneous';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Salaries & Wages',
  'Office Rent',
  'Travel & Transportation',
  'Food & Accommodation',
  'Marketing & Advertising',
  'Software & Subscriptions',
  'Internet & Utilities',
  'Training & Education',
  'Equipment & Supplies',
  'Miscellaneous',
];

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';

export const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];

export type ExpensePaymentStatus = 'Paid' | 'Pending' | 'Partially Paid';

export const EXPENSE_PAYMENT_STATUSES: ExpensePaymentStatus[] = ['Paid', 'Pending', 'Partially Paid'];

export interface Expense {
  id: string;
  date: string; // ISO date string
  title: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidAmount: number; // For partially paid tracking
  paymentMethod: PaymentMethod;
  paidBy: string;
  vendorName: string;
  paymentStatus: ExpensePaymentStatus;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Revenue Types ───────────────────────────────────────────────────────────

export type RevenueCategory =
  | 'Product Sales'
  | 'Service Revenue'
  | 'Consulting'
  | 'Subscription Revenue'
  | 'Licensing Fees'
  | 'Commission'
  | 'Interest Income'
  | 'Rental Income'
  | 'Other Income';

export const REVENUE_CATEGORIES: RevenueCategory[] = [
  'Product Sales',
  'Service Revenue',
  'Consulting',
  'Subscription Revenue',
  'Licensing Fees',
  'Commission',
  'Interest Income',
  'Rental Income',
  'Other Income',
];

export type RevenuePaymentStatus = 'Received' | 'Pending' | 'Partially Received';

export const REVENUE_PAYMENT_STATUSES: RevenuePaymentStatus[] = ['Received', 'Pending', 'Partially Received'];

export interface Revenue {
  id: string;
  date: string; // ISO date string
  source: string;
  clientName: string;
  description: string;
  category: RevenueCategory;
  amount: number;
  receivedAmount: number; // For partially received tracking
  paymentMethod: PaymentMethod;
  paymentStatus: RevenuePaymentStatus;
  invoiceNumber: string;
  expectedPaymentDate: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Filter Types ────────────────────────────────────────────────────────────

export type DatePreset =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom'
  | 'all';

export interface Filters {
  datePreset: DatePreset;
  startDate: string;
  endDate: string;
  expenseCategory: ExpenseCategory | 'all';
  revenueCategory: RevenueCategory | 'all';
  paymentStatus: string;
  employee: string;
  searchQuery: string;
}

// ─── Chart Types ─────────────────────────────────────────────────────────────

export type ChartTimeframe = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

// ─── Dashboard KPI Types ─────────────────────────────────────────────────────

export interface KPIData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  pendingPayments: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  prevTotalRevenue: number;
  prevTotalExpenses: number;
  prevNetProfit: number;
  prevProfitMargin: number;
  prevPendingPayments: number;
  prevMonthlyRevenue: number;
  prevMonthlyExpenses: number;
  cashInflow: number;
  cashOutflow: number;
  cashFlow: number;
}

// ─── Settings Types ──────────────────────────────────────────────────────────

export interface AppSettings {
  companyName: string;
  currency: string;
  financialYearStart: number; // month (0-11)
  theme: 'light';
}

// ─── Report Types ────────────────────────────────────────────────────────────

export type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface ReportData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  cashInflow: number;
  cashOutflow: number;
  cashFlow: number;
  topExpenseCategories: { category: string; amount: number }[];
  topRevenueSources: { source: string; amount: number }[];
}
