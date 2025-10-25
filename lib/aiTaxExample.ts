/**
 * Example usage of AI-enhanced tax logic
 * Demonstrates how to use the new AI-powered tax calculation features
 */

import { 
  generateAITaxSummary, 
  processTaxRefund,
  getDeductionRecommendations,
  updateDocumentationStatus
} from './taxLogic';
import { 
  analyzeTransactionsWithAI,
  categorizeExpenseWithAI 
} from './aiTaxLogic';
import type { Transaction } from '../types/transactions';

/**
 * Example: AI-enhanced tax calculation for a sample user
 */
export const exampleAITaxCalculation = async () => {
  // Sample transactions for a Nigerian taxpayer
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      userId: 'user123',
      date: new Date('2024-01-15'),
      description: 'Monthly salary from ABC Company',
      amount: 500000,
      type: 'income',
      category: 'Salary',
      source: 'Bank Transfer',
      isDeductible: false,
      createdAt: new Date()
    },
    {
      id: '2',
      userId: 'user123',
      date: new Date('2024-01-20'),
      description: 'Pension contribution to PENCOM',
      amount: 50000,
      type: 'expense',
      category: 'Pension',
      source: 'Bank Transfer',
      isDeductible: true,
      createdAt: new Date()
    },
    {
      id: '3',
      userId: 'user123',
      date: new Date('2024-01-25'),
      description: 'Rent payment for apartment',
      amount: 150000,
      type: 'expense',
      category: 'Housing',
      source: 'Bank Transfer',
      isDeductible: false,
      createdAt: new Date()
    },
    {
      id: '4',
      userId: 'user123',
      date: new Date('2024-02-01'),
      description: 'National Housing Fund contribution',
      amount: 25000,
      type: 'expense',
      category: 'NHF',
      source: 'Bank Transfer',
      isDeductible: true,
      createdAt: new Date()
    },
    {
      id: '5',
      userId: 'user123',
      date: new Date('2024-02-15'),
      description: 'Life insurance premium',
      amount: 30000,
      type: 'expense',
      category: 'Insurance',
      source: 'Bank Transfer',
      isDeductible: true,
      createdAt: new Date()
    }
  ];

  console.log('🧾 AI-Enhanced Tax Calculation Example');
  console.log('=====================================');

  // Step 1: Analyze transactions with AI
  console.log('\n1. Analyzing transactions with AI...');
  const analyzedTransactions = await analyzeTransactionsWithAI(sampleTransactions);
  
  analyzedTransactions.forEach(transaction => {
    if (transaction.aiVerification) {
      console.log(`\nTransaction: ${transaction.description}`);
      console.log(`AI Verification: ${transaction.aiVerification.isVerified ? '✅ Verified' : '❌ Not Verified'}`);
      console.log(`Confidence: ${(transaction.aiVerification.confidence * 100).toFixed(1)}%`);
      console.log(`Reasoning: ${transaction.aiVerification.reasoning}`);
      console.log(`Suggested Deduction Type: ${transaction.aiVerification.suggestedDeductionType}`);
    }
  });

  // Step 2: Generate AI-enhanced tax summary
  console.log('\n2. Generating AI-enhanced tax summary...');
  const taxSummary = await generateAITaxSummary('user123', analyzedTransactions, '2024-01');
  
  console.log('\n📊 Tax Summary:');
  console.log(`Total Income: ₦${taxSummary.totalIncome.toLocaleString()}`);
  console.log(`Total Expenses: ₦${taxSummary.totalExpenses.toLocaleString()}`);
  console.log(`Deductible Expenses: ₦${taxSummary.deductibleExpenses?.toLocaleString()}`);
  console.log(`Rent Relief: ₦${taxSummary.rentRelief?.toLocaleString()}`);
  console.log(`Taxable Income: ₦${taxSummary.taxableIncome.toLocaleString()}`);
  console.log(`Estimated Tax: ₦${taxSummary.estimatedTax.toLocaleString()}`);
  
  console.log('\n🤖 AI Verification Status:');
  console.log(`AI Verified Deductions: ₦${taxSummary.aiVerifiedDeductions?.toLocaleString()}`);
  console.log(`Documentation Verified: ₦${taxSummary.documentationVerifiedDeductions?.toLocaleString()}`);
  console.log(`Pending Verification: ₦${taxSummary.pendingVerificationDeductions?.toLocaleString()}`);

  // Step 3: Get deduction recommendations
  console.log('\n3. Getting deduction recommendations...');
  const recommendations = getDeductionRecommendations(analyzedTransactions);
  
  console.log('\n💡 Recommendations:');
  recommendations.recommendedDeductions.forEach(rec => console.log(`- ${rec}`));
  console.log(`\nPotential Tax Savings: ₦${recommendations.potentialSavings.toLocaleString()}`);
  
  if (recommendations.missingDocumentation.length > 0) {
    console.log('\n📄 Missing Documentation:');
    recommendations.missingDocumentation.forEach(doc => console.log(`- ${doc}`));
  }

  // Step 4: Example of expense categorization with AI
  console.log('\n4. AI-powered expense categorization example...');
  const expenseAnalysis = await categorizeExpenseWithAI('Office rent payment for business premises', 200000);
  console.log(`\nExpense: "Office rent payment for business premises"`);
  console.log(`AI Category: ${expenseAnalysis.category}`);
  console.log(`Deduction Type: ${expenseAnalysis.deductionType}`);
  console.log(`Is Deductible: ${expenseAnalysis.isDeductible ? 'Yes' : 'No'}`);
  console.log(`Confidence: ${(expenseAnalysis.confidence * 100).toFixed(1)}%`);

  return {
    taxSummary,
    analyzedTransactions,
    recommendations,
    expenseAnalysis
  };
};

/**
 * Example: Processing a tax refund with new documentation
 */
export const exampleTaxRefund = async () => {
  console.log('\n🔄 Tax Refund Processing Example');
  console.log('================================');

  // New transactions with supporting documentation
  const newTransactions: Transaction[] = [
    {
      id: '6',
      userId: 'user123',
      date: new Date('2024-03-01'),
      description: 'Additional pension contribution',
      amount: 30000,
      type: 'expense',
      category: 'Pension',
      source: 'Bank Transfer',
      isDeductible: true,
      createdAt: new Date(),
      documentationStatus: {
        hasPensionSlip: true,
        hasReceipt: true,
        hasRentAgreement: false,
        hasInsurancePolicy: false,
        hasLoanDocument: false,
        isVerified: true,
        verificationDate: new Date()
      }
    }
  ];

  const supportingDocuments = ['pension_slip_2024_03.pdf', 'bank_statement_2024_03.pdf'];

  // Process tax refund
  const taxAdjustment = await processTaxRefund(
    'user123',
    'tax_summary_123',
    newTransactions,
    supportingDocuments
  );

  console.log('\n📋 Tax Adjustment Details:');
  console.log(`Adjustment Type: ${taxAdjustment.adjustmentType}`);
  console.log(`Amount: ₦${taxAdjustment.amount.toLocaleString()}`);
  console.log(`Reason: ${taxAdjustment.reason}`);
  console.log(`Status: ${taxAdjustment.status}`);
  console.log(`Supporting Documents: ${taxAdjustment.supportingDocuments.join(', ')}`);

  return taxAdjustment;
};

/**
 * Example: Updating documentation status
 */
export const exampleDocumentationUpdate = () => {
  console.log('\n📄 Documentation Update Example');
  console.log('==============================');

  const transaction: Transaction = {
    id: '7',
    userId: 'user123',
    date: new Date('2024-02-01'),
    description: 'Rent payment for apartment',
    amount: 150000,
    type: 'expense',
    category: 'Housing',
    source: 'Bank Transfer',
    isDeductible: false,
    createdAt: new Date()
  };

  console.log('\nBefore documentation update:');
  console.log(`Documentation Status: ${transaction.documentationStatus?.isVerified ? 'Verified' : 'Not Verified'}`);

  // Update documentation status
  const updatedTransaction = updateDocumentationStatus(transaction, {
    hasRentAgreement: true,
    hasReceipt: true
  });

  console.log('\nAfter documentation update:');
  console.log(`Documentation Status: ${updatedTransaction.documentationStatus?.isVerified ? 'Verified' : 'Not Verified'}`);
  console.log(`Has Rent Agreement: ${updatedTransaction.documentationStatus?.hasRentAgreement ? 'Yes' : 'No'}`);
  console.log(`Has Receipt: ${updatedTransaction.documentationStatus?.hasReceipt ? 'Yes' : 'No'}`);
  console.log(`Verification Date: ${updatedTransaction.documentationStatus?.verificationDate?.toISOString()}`);

  return updatedTransaction;
};

/**
 * Run all examples
 */
export const runAllExamples = async () => {
  try {
    console.log('🚀 Running AI-Enhanced Tax Logic Examples');
    console.log('==========================================\n');

    // Run AI tax calculation example
    await exampleAITaxCalculation();

    // Run tax refund example
    await exampleTaxRefund();

    // Run documentation update example
    exampleDocumentationUpdate();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
};
