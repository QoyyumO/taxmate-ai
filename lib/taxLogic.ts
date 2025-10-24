import type { Transaction, TaxSummary } from '../types/transactions';

/**
 * Calculate Personal Income Tax based on Nigeria's NEW 2026 tax brackets
 * @param taxableIncome - The taxable income amount
 * @returns The calculated tax amount
 */
export const calculatePersonalIncomeTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  
  // New 2026 progressive tax structure
  if (taxableIncome <= 800000) {
    // Full exemption for minimum wage earners (₦800,000 and below)
    return 0;
  } else if (taxableIncome <= 3000000) {
    // 15% on income from ₦800,001 to ₦3,000,000
    return (taxableIncome - 800000) * 0.15;
  } else if (taxableIncome <= 12000000) {
    // 18% on income from ₦3,000,001 to ₦12,000,000
    return (3000000 - 800000) * 0.15 + (taxableIncome - 3000000) * 0.18;
  } else if (taxableIncome <= 25000000) {
    // 21% on income from ₦12,000,001 to ₦25,000,000
    return (3000000 - 800000) * 0.15 + (12000000 - 3000000) * 0.18 + (taxableIncome - 12000000) * 0.21;
  } else if (taxableIncome <= 50000000) {
    // 23% on income from ₦25,000,001 to ₦50,000,000
    return (3000000 - 800000) * 0.15 + (12000000 - 3000000) * 0.18 + (25000000 - 12000000) * 0.21 + (taxableIncome - 25000000) * 0.23;
  } else {
    // 25% on income above ₦50,000,000
    return (3000000 - 800000) * 0.15 + (12000000 - 3000000) * 0.18 + (25000000 - 12000000) * 0.21 + (50000000 - 25000000) * 0.23 + (taxableIncome - 50000000) * 0.25;
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
 * Calculate Rent Relief (NEW 2026)
 * Rent Relief = lower of ₦500,000 or 20% of annual rent paid
 */
export const calculateRentRelief = (transactions: Transaction[]): number => {
  // Find rent-related transactions
  const rentTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    (t.description.toLowerCase().includes('rent') || 
     t.category.toLowerCase().includes('rent') ||
     t.description.toLowerCase().includes('accommodation'))
  );
  
  const totalRentPaid = rentTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Rent Relief = lower of ₦500,000 or 20% of annual rent paid
  return Math.min(500000, totalRentPaid * 0.20);
};

/**
 * Calculate taxable income (UPDATED 2026)
 * Formula: Total Income - Deductible Expenses - Rent Relief
 */
export const calculateTaxableIncome = (transactions: Transaction[]): number => {
  const totalIncome = calculateTotalIncome(transactions);
  const deductibleExpenses = calculateDeductibleExpenses(transactions);
  const rentRelief = calculateRentRelief(transactions);
  
  return Math.max(0, totalIncome - deductibleExpenses - rentRelief);
};

/**
 * Generate tax summary for a given period (UPDATED 2026)
 */
export const generateTaxSummary = (
  userId: string,
  transactions: Transaction[],
  period: string = new Date().toISOString().slice(0, 7) // YYYY-MM format
): Omit<TaxSummary, 'id' | 'createdAt'> => {
  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const deductibleExpenses = calculateDeductibleExpenses(transactions);
  const rentRelief = calculateRentRelief(transactions);
  const taxableIncome = calculateTaxableIncome(transactions);
  const estimatedTax = calculatePersonalIncomeTax(taxableIncome);

  return {
    userId,
    period,
    totalIncome,
    totalExpenses,
    taxableIncome,
    estimatedTax,
    // Additional 2026 information
    deductibleExpenses,
    rentRelief,
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
 * Get tax bracket information for 2026 Nigerian tax structure
 */
export const getTaxBracketInfo = (taxableIncome: number) => {
  const brackets = [
    { min: 0, max: 800000, rate: 0, description: '₦0 - ₦800,000 (Full exemption)' },
    { min: 800000, max: 3000000, rate: 0.15, description: '₦800,001 - ₦3,000,000 (15%)' },
    { min: 3000000, max: 12000000, rate: 0.18, description: '₦3,000,001 - ₦12,000,000 (18%)' },
    { min: 12000000, max: 25000000, rate: 0.21, description: '₦12,000,001 - ₦25,000,000 (21%)' },
    { min: 25000000, max: 50000000, rate: 0.23, description: '₦25,000,001 - ₦50,000,000 (23%)' },
    { min: 50000000, max: Infinity, rate: 0.25, description: 'Above ₦50,000,000 (25%)' },
  ];

  return brackets.map(bracket => ({
    ...bracket,
    applicable: taxableIncome > bracket.min,
    amountInBracket: Math.min(Math.max(0, taxableIncome - bracket.min), bracket.max - bracket.min),
    taxInBracket: Math.min(Math.max(0, taxableIncome - bracket.min), bracket.max - bracket.min) * bracket.rate,
  }));
};
