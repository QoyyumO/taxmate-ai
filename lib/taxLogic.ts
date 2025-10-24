import type { Transaction, TaxSummary } from '../types/transactions';

/**
 * Calculate Personal Income Tax based on Nigeria's tax brackets
 * @param taxableIncome - The taxable income amount
 * @returns The calculated tax amount
 */
export const calculatePersonalIncomeTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  
  if (taxableIncome <= 300000) {
    return taxableIncome * 0.07;
  } else if (taxableIncome <= 600000) {
    return 21000 + (taxableIncome - 300000) * 0.11;
  } else if (taxableIncome <= 1100000) {
    return 54000 + (taxableIncome - 600000) * 0.15;
  } else {
    return 129000 + (taxableIncome - 1100000) * 0.19;
  }
};

/**
 * Calculate total income from transactions
 */
export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate total expenses from transactions
 */
export const calculateTotalExpenses = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate deductible expenses
 */
export const calculateDeductibleExpenses = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.type === 'expense' && t.isDeductible)
    .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculate taxable income
 * Formula: Total Income - Deductible Expenses
 */
export const calculateTaxableIncome = (transactions: Transaction[]): number => {
  const totalIncome = calculateTotalIncome(transactions);
  const deductibleExpenses = calculateDeductibleExpenses(transactions);
  
  return Math.max(0, totalIncome - deductibleExpenses);
};

/**
 * Generate tax summary for a given period
 */
export const generateTaxSummary = (
  userId: string,
  transactions: Transaction[],
  period: string = new Date().toISOString().slice(0, 7) // YYYY-MM format
): Omit<TaxSummary, 'id' | 'createdAt'> => {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const taxableIncome = calculateTaxableIncome(transactions);
  const estimatedTax = calculatePersonalIncomeTax(taxableIncome);

  return {
    userId,
    period,
    totalIncome,
    totalExpenses,
    taxableIncome,
    estimatedTax,
  };
};

/**
 * Get current tax year period
 */
export const getCurrentTaxPeriod = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  return `${year}-${month.toString().padStart(2, '0')}`;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get tax bracket information
 */
export const getTaxBracketInfo = (taxableIncome: number) => {
  const brackets = [
    { min: 0, max: 300000, rate: 0.07, description: 'First ₦300,000' },
    { min: 300000, max: 600000, rate: 0.11, description: 'Next ₦300,000' },
    { min: 600000, max: 1100000, rate: 0.15, description: 'Next ₦500,000' },
    { min: 1100000, max: Infinity, rate: 0.19, description: 'Above ₦1,100,000' },
  ];

  return brackets.map(bracket => ({
    ...bracket,
    applicable: taxableIncome > bracket.min,
    amountInBracket: Math.min(taxableIncome - bracket.min, bracket.max - bracket.min),
  }));
};
