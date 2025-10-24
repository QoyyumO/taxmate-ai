export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface Transaction {
  id?: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  source: string;
  isDeductible: boolean;
  createdAt: Date;
}

export interface CsvUpload {
  id?: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  recordCount: number;
  status: 'processing' | 'completed' | 'failed';
}

export interface TaxSummary {
  id?: string;
  userId: string;
  period: string; // e.g., "2024-Q1"
  totalIncome: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  createdAt: Date;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  estimatedTax: number;
  netIncome: number;
}

export interface CsvRow {
  date: string;
  description: string;
  amount: string;
  type: string;
  category?: string;
  source?: string;
  isDeductible?: string;
}

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  source: string;
  isDeductible: boolean;
}
