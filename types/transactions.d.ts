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
  // AI-powered enhancements
  aiVerification?: AIVerification;
  documentationStatus?: DocumentationStatus;
  deductionType?: DeductionType;
  rentReliefEligible?: boolean;
}

export interface AIVerification {
  isVerified: boolean;
  confidence: number; // 0-1 scale
  reasoning: string;
  suggestedCategory?: string;
  suggestedDeductionType?: DeductionType;
  lastVerified: Date;
}

export interface DocumentationStatus {
  hasReceipt: boolean;
  hasPensionSlip: boolean;
  hasRentAgreement: boolean;
  hasInsurancePolicy: boolean;
  hasLoanDocument: boolean;
  isVerified: boolean;
  verificationDate?: Date;
}

export type DeductionType = 
  | 'NHF' // National Housing Fund
  | 'NHIS' // National Health Insurance Scheme
  | 'PENSION' // Pension Reform Act
  | 'HOUSE_LOAN_INTEREST' // Interest on owner-occupied house loan
  | 'LIFE_INSURANCE' // Life insurance or annuity premium
  | 'RENT_RELIEF' // Rent relief (20% of rent or ₦500,000)
  | 'BUSINESS_RENT' // Rent for business premises
  | 'EMPLOYEE_SALARIES' // Employee salaries and benefits
  | 'BUSINESS_MAINTENANCE' // Repair and maintenance
  | 'RND' // Research and development
  | 'BAD_DEBT' // Bad or doubtful debts
  | 'DISABILITY_EXPENSE' // Assistive or disability-related expenses
  | 'OTHER_BUSINESS' // Other business expenses
  | 'NON_DEDUCTIBLE'; // Not deductible

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
  // New 2026 fields
  deductibleExpenses?: number;
  rentRelief?: number;
  // AI-enhanced fields
  aiVerifiedDeductions?: number;
  documentationVerifiedDeductions?: number;
  pendingVerificationDeductions?: number;
  taxAdjustments?: TaxAdjustment[];
  createdAt: Date;
}

export interface TaxAdjustment {
  id?: string;
  userId: string;
  originalTaxSummaryId: string;
  adjustmentType: 'REFUND' | 'ADDITIONAL_TAX' | 'DEDUCTION_UPDATE';
  amount: number;
  reason: string;
  supportingDocuments: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  processedAt?: Date;
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
