import { GoogleGenAI } from '@google/genai';
import type { Transaction, AIVerification, DeductionType, TaxAdjustment } from '../types/transactions';
import { getTransactionAnalysisPrompt, getExpenseCategorizationPrompt } from './aiConfig';

// Google AI client will be initialized in functions to ensure server-side only usage

// Enhanced rate limiting with minute and daily tracking
let minuteRequestCount = 0;
let dailyRequestCount = 0;
let lastMinuteReset = Date.now();
let lastDayReset = Date.now();
const MAX_REQUESTS_PER_MINUTE = 20; // Conservative limit
const MAX_REQUESTS_PER_DAY = 1000; // Daily limit
const MINUTE_WINDOW = 60000; // 1 minute
const DAY_WINDOW = 86400000; // 24 hours

// Circuit breaker pattern
let circuitBreakerState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
let failureCount = 0;
let lastFailureTime = 0;
const MAX_FAILURES = 5;
const CIRCUIT_BREAKER_TIMEOUT = 300000; // 5 minutes

const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Reset minute counter
  if (now - lastMinuteReset >= MINUTE_WINDOW) {
    minuteRequestCount = 0;
    lastMinuteReset = now;
  }
  
  // Reset daily counter
  if (now - lastDayReset >= DAY_WINDOW) {
    dailyRequestCount = 0;
    lastDayReset = now;
  }
  
  // Check daily limit
  if (dailyRequestCount >= MAX_REQUESTS_PER_DAY) {
    console.log(`Daily rate limit reached: ${dailyRequestCount}/${MAX_REQUESTS_PER_DAY} requests today`);
    return false;
  }
  
  // Check minute limit
  if (minuteRequestCount >= MAX_REQUESTS_PER_MINUTE) {
    console.log(`Minute rate limit reached: ${minuteRequestCount}/${MAX_REQUESTS_PER_MINUTE} requests this minute`);
    return false;
  }
  
  minuteRequestCount++;
  dailyRequestCount++;
  return true;
};

const checkCircuitBreaker = (): boolean => {
  const now = Date.now();
  
  if (circuitBreakerState === 'OPEN') {
    if (now - lastFailureTime >= CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreakerState = 'HALF_OPEN';
      console.log('Circuit breaker: Moving to HALF_OPEN state');
      return true;
    }
    return false;
  }
  
  return true;
};

const recordSuccess = () => {
  if (circuitBreakerState === 'HALF_OPEN') {
    circuitBreakerState = 'CLOSED';
    failureCount = 0;
    console.log('Circuit breaker: Moving to CLOSED state');
  }
};

const recordFailure = () => {
  failureCount++;
  lastFailureTime = Date.now();
  
  if (failureCount >= MAX_FAILURES) {
    circuitBreakerState = 'OPEN';
    console.log(`Circuit breaker: Moving to OPEN state after ${failureCount} failures`);
  }
};

// Improved JSON parsing with extraction from malformed responses
const parseAIResponse = (text: string): any => {
  if (!text || text.trim() === '') {
    throw new Error('Empty response');
  }
  
  // Try direct JSON parsing first
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from malformed response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        console.warn('Failed to parse extracted JSON');
      }
    }
    
    // Try to find JSON-like structure
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
        try {
          return JSON.parse(line.trim());
        } catch {
          continue;
        }
      }
    }
    
    throw new Error('No valid JSON found in response');
  }
};

// Response validation
const validateAIResponse = (response: any, expectedFields: string[]): boolean => {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  for (const field of expectedFields) {
    if (!(field in response)) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
};

// Smart batching with delays
const processBatchWithDelay = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
  delayMs: number = 1000
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`Batch processing failed at index ${i}:`, error);
      // Continue with fallback for this batch
      const fallbackResults = batch.map(() => null as R);
      results.push(...fallbackResults);
    }
  }
  
  return results;
};


/**
 * AI-powered deduction detection using Google AI Studio
 */
export const analyzeTransactionWithAI = async (transaction: Transaction): Promise<AIVerification> => {
  // Check if Google AI API key is available
  if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
    console.warn('Google AI Studio API key not configured, using fallback analysis');
    return getFallbackAnalysis(transaction);
  }

  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    console.log('Circuit breaker is OPEN, using fallback analysis');
    return getFallbackAnalysis(transaction);
  }

  // Check rate limits
  if (!checkRateLimit()) {
    console.log('Rate limit exceeded, using fallback analysis');
    return getFallbackAnalysis(transaction);
  }

  try {
    // Initialize Google AI client (server-side only)
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY,
    });

    const prompt = getTransactionAnalysisPrompt(transaction);

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: prompt,
    });
    const aiText = result.text || '';
    
    // Improved JSON parsing
    let aiResponse;
    try {
      aiResponse = parseAIResponse(aiText);
    } catch (parseError) {
      console.warn('AI returned non-JSON response, using fallback analysis:', parseError);
      recordFailure();
      return getFallbackAnalysis(transaction);
    }
    
    // Validate response structure
    const requiredFields = ['isVerified', 'confidence', 'reasoning', 'suggestedDeductionType'];
    if (!validateAIResponse(aiResponse, requiredFields)) {
      console.warn('AI response validation failed, using fallback analysis');
      recordFailure();
      return getFallbackAnalysis(transaction);
    }
    
    // Record success
    recordSuccess();
    
    return {
      isVerified: aiResponse.isVerified || false,
      confidence: aiResponse.confidence || 0.5,
      reasoning: aiResponse.reasoning || 'AI analysis completed',
      suggestedCategory: transaction.category,
      suggestedDeductionType: aiResponse.suggestedDeductionType || 'NON_DEDUCTIBLE',
      lastVerified: new Date()
    };
  } catch (error: any) {
    console.error('AI analysis failed:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      console.log('Rate limit error (429), using fallback analysis');
      recordFailure();
    } else if (error.message?.includes('quota')) {
      console.log('Quota exceeded, using fallback analysis');
      recordFailure();
    } else {
      recordFailure();
    }
    
    return getFallbackAnalysis(transaction);
  }
};

/**
 * Fallback analysis when AI is not available or returns non-JSON
 */
const getFallbackAnalysis = (transaction: Transaction): AIVerification => {
  const description = transaction.description.toLowerCase();
  
  // Enhanced keyword-based analysis
  let isVerified = false;
  let confidence = 0.5;
  let reasoning = 'Smart analysis - manual review recommended';
  let suggestedDeductionType: DeductionType = 'NON_DEDUCTIBLE';
  
  // Enhanced keyword matching with multiple variations
  if (description.includes('pension') || description.includes('pencom') || description.includes('retirement') || description.includes('pfa')) {
    isVerified = true;
    confidence = 0.9;
    reasoning = 'Pension contribution detected - highly deductible under Nigeria Tax Act 2025';
    suggestedDeductionType = 'PENSION';
  } else if (description.includes('nhf') || description.includes('housing fund') || description.includes('national housing')) {
    isVerified = true;
    confidence = 0.9;
    reasoning = 'National Housing Fund contribution - fully deductible';
    suggestedDeductionType = 'NHF';
  } else if (description.includes('nhis') || description.includes('health insurance') || description.includes('national health')) {
    isVerified = true;
    confidence = 0.9;
    reasoning = 'National Health Insurance Scheme contribution - fully deductible';
    suggestedDeductionType = 'NHIS';
  } else if (description.includes('life insurance') || description.includes('insurance premium') || description.includes('annuity')) {
    isVerified = true;
    confidence = 0.8;
    reasoning = 'Life insurance premium - deductible for self or spouse';
    suggestedDeductionType = 'LIFE_INSURANCE';
  } else if (description.includes('rent') && !description.includes('business') && !description.includes('office')) {
    isVerified = true;
    confidence = 0.7;
    reasoning = 'Personal rent payment - may qualify for rent relief (20% or ₦500,000)';
    suggestedDeductionType = 'RENT_RELIEF';
  } else if ((description.includes('business') || description.includes('office')) && description.includes('rent')) {
    isVerified = true;
    confidence = 0.8;
    reasoning = 'Business rent expense - fully deductible';
    suggestedDeductionType = 'BUSINESS_RENT';
  } else if (description.includes('salary') || description.includes('wage') || description.includes('employee')) {
    isVerified = true;
    confidence = 0.8;
    reasoning = 'Employee compensation - deductible business expense';
    suggestedDeductionType = 'EMPLOYEE_SALARIES';
  } else if (description.includes('repair') || description.includes('maintenance') || description.includes('service')) {
    isVerified = true;
    confidence = 0.7;
    reasoning = 'Repair/maintenance expense - likely deductible';
    suggestedDeductionType = 'BUSINESS_MAINTENANCE';
  } else if (description.includes('research') || description.includes('development') || description.includes('r&d')) {
    isVerified = true;
    confidence = 0.8;
    reasoning = 'Research and development - deductible business expense';
    suggestedDeductionType = 'RND';
  } else if (description.includes('loan') && description.includes('interest') && description.includes('house')) {
    isVerified = true;
    confidence = 0.8;
    reasoning = 'Home loan interest - deductible for owner-occupied house';
    suggestedDeductionType = 'HOUSE_LOAN_INTEREST';
  } else if (description.includes('disability') || description.includes('assistive') || description.includes('accessibility')) {
    isVerified = true;
    confidence = 0.8;
    reasoning = 'Disability-related expense - deductible';
    suggestedDeductionType = 'DISABILITY_EXPENSE';
  } else if (description.includes('bad debt') || description.includes('doubtful debt')) {
    isVerified = true;
    confidence = 0.7;
    reasoning = 'Bad debt expense - deductible if business-related';
    suggestedDeductionType = 'BAD_DEBT';
  }
  
  return {
    isVerified,
    confidence,
    reasoning,
    suggestedCategory: transaction.category,
    suggestedDeductionType,
    lastVerified: new Date()
  };
};

/**
 * Batch AI analysis for multiple transactions with smart batching
 */
export const analyzeTransactionsWithAI = async (transactions: Transaction[]): Promise<Transaction[]> => {
  // Fallback for large datasets
  if (transactions.length > 50) {
    console.log(`Large dataset detected (${transactions.length} transactions), using fallback analysis`);
    return transactions.map(transaction => {
      const fallbackAnalysis = getFallbackAnalysis(transaction);
      return {
        ...transaction,
        aiVerification: fallbackAnalysis,
        deductionType: fallbackAnalysis.suggestedDeductionType ?? 'NON_DEDUCTIBLE',
        rentReliefEligible: fallbackAnalysis.suggestedDeductionType === 'RENT_RELIEF'
      };
    });
  }

  // Use smart batching for smaller datasets
  const batchSize = 5; // Process 5 transactions at a time
  const delayMs = 2000; // 2 second delay between batches
  
  const analyzedTransactions = await processBatchWithDelay(
    transactions,
    async (transaction) => {
      const aiVerification = await analyzeTransactionWithAI(transaction);
      return {
        ...transaction,
        aiVerification,
        deductionType: aiVerification.suggestedDeductionType ?? 'NON_DEDUCTIBLE',
        rentReliefEligible: aiVerification.suggestedDeductionType === 'RENT_RELIEF'
      };
    },
    batchSize,
    delayMs
  );
  
  return analyzedTransactions.filter(Boolean); // Remove null results
};

/**
 * Enhanced deduction calculation with AI verification
 */
export const calculateAIVerifiedDeductions = (transactions: Transaction[]): {
  totalDeductions: number;
  aiVerifiedDeductions: number;
  documentationVerifiedDeductions: number;
  pendingVerificationDeductions: number;
  deductionBreakdown: Record<DeductionType, number>;
} => {
  const deductionBreakdown: Record<DeductionType, number> = {
    NHF: 0,
    NHIS: 0,
    PENSION: 0,
    HOUSE_LOAN_INTEREST: 0,
    LIFE_INSURANCE: 0,
    RENT_RELIEF: 0,
    BUSINESS_RENT: 0,
    EMPLOYEE_SALARIES: 0,
    BUSINESS_MAINTENANCE: 0,
    RND: 0,
    BAD_DEBT: 0,
    DISABILITY_EXPENSE: 0,
    OTHER_BUSINESS: 0,
    NON_DEDUCTIBLE: 0
  };

  let aiVerifiedDeductions = 0;
  let documentationVerifiedDeductions = 0;
  let pendingVerificationDeductions = 0;

  transactions.forEach(transaction => {
    if (transaction.type === 'expense' && transaction.deductionType) {
      const amount = transaction.amount;
      deductionBreakdown[transaction.deductionType] += amount;

      // Categorize by verification status
      if (transaction.aiVerification?.isVerified) {
        aiVerifiedDeductions += amount;
      }
      
      if (transaction.documentationStatus?.isVerified) {
        documentationVerifiedDeductions += amount;
      } else {
        pendingVerificationDeductions += amount;
      }
    }
  });

  const totalDeductions = Object.values(deductionBreakdown).reduce((sum, amount) => sum + amount, 0);

  return {
    totalDeductions,
    aiVerifiedDeductions,
    documentationVerifiedDeductions,
    pendingVerificationDeductions,
    deductionBreakdown
  };
};

/**
 * Enhanced Rent Relief calculation with AI verification
 */
export const calculateAIRentRelief = (transactions: Transaction[]): {
  totalRentRelief: number;
  eligibleRentTransactions: Transaction[];
  calculation: {
    totalRentPaid: number;
    twentyPercent: number;
    capAmount: number;
    finalRelief: number;
  };
} => {
  const eligibleRentTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    t.rentReliefEligible &&
    (t.description.toLowerCase().includes('rent') || 
     t.description.toLowerCase().includes('accommodation') ||
     t.description.toLowerCase().includes('housing'))
  );

  const totalRentPaid = eligibleRentTransactions.reduce((sum, t) => sum + t.amount, 0);
  const twentyPercent = totalRentPaid * 0.20;
  const capAmount = 500000;
  const finalRelief = Math.min(capAmount, twentyPercent);

  return {
    totalRentRelief: finalRelief,
    eligibleRentTransactions,
    calculation: {
      totalRentPaid,
      twentyPercent,
      capAmount,
      finalRelief
    }
  };
};

/**
 * Generate tax adjustment for refunds or corrections
 */
export const generateTaxAdjustment = (
  userId: string,
  originalTaxSummaryId: string,
  adjustmentType: 'REFUND' | 'ADDITIONAL_TAX' | 'DEDUCTION_UPDATE',
  amount: number,
  reason: string,
  supportingDocuments: string[] = []
): Omit<TaxAdjustment, 'id' | 'createdAt'> => {
  return {
    userId,
    originalTaxSummaryId,
    adjustmentType,
    amount,
    reason,
    supportingDocuments,
    status: 'PENDING'
  };
};

/**
 * Validate documentation for deductions
 */
export const validateDocumentation = (transaction: Transaction): boolean => {
  if (!transaction.documentationStatus) return false;
  
  const { documentationStatus } = transaction;
  
  // Check if at least one relevant document exists
  const hasRelevantDocument = 
    documentationStatus.hasReceipt ||
    documentationStatus.hasPensionSlip ||
    documentationStatus.hasRentAgreement ||
    documentationStatus.hasInsurancePolicy ||
    documentationStatus.hasLoanDocument;

  return hasRelevantDocument && documentationStatus.isVerified;
};

/**
 * AI-powered expense categorization
 */
export const categorizeExpenseWithAI = async (description: string, amount: number): Promise<{
  category: string;
  deductionType: DeductionType;
  isDeductible: boolean;
  confidence: number;
}> => {
  // Check if Google AI API key is available
  if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
    console.warn('Google AI Studio API key not configured, using fallback categorization');
    return getFallbackCategorization(description);
  }

  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    console.log('Circuit breaker is OPEN, using fallback categorization');
    return getFallbackCategorization(description);
  }

  // Check rate limits
  if (!checkRateLimit()) {
    console.log('Rate limit exceeded, using fallback categorization');
    return getFallbackCategorization(description);
  }

  try {
    // Initialize Google AI client (server-side only)
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY,
    });

    const prompt = getExpenseCategorizationPrompt(description, amount);

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: prompt,
    });
    const aiText = result.text || '';
    
    // Improved JSON parsing
    let aiResponse;
    try {
      aiResponse = parseAIResponse(aiText);
    } catch (parseError) {
      console.warn('AI returned non-JSON response, using fallback categorization:', parseError);
      recordFailure();
      return getFallbackCategorization(description);
    }
    
    // Validate response structure
    const requiredFields = ['category', 'deductionType', 'isDeductible', 'confidence'];
    if (!validateAIResponse(aiResponse, requiredFields)) {
      console.warn('AI response validation failed, using fallback categorization');
      recordFailure();
      return getFallbackCategorization(description);
    }
    
    // Record success
    recordSuccess();
    
    return aiResponse;
  } catch (error: any) {
    console.error('AI categorization failed:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      console.log('Rate limit error (429), using fallback categorization');
      recordFailure();
    } else if (error.message?.includes('quota')) {
      console.log('Quota exceeded, using fallback categorization');
      recordFailure();
    } else {
      recordFailure();
    }
    
    return getFallbackCategorization(description);
  }
};

/**
 * Fallback categorization when AI is not available
 */
const getFallbackCategorization = (description: string): {
  category: string;
  deductionType: DeductionType;
  isDeductible: boolean;
  confidence: number;
} => {
  const desc = description.toLowerCase();
  
  if (desc.includes('pension') || desc.includes('pencom') || desc.includes('retirement')) {
    return {
      category: 'Pension',
      deductionType: 'PENSION',
      isDeductible: true,
      confidence: 0.9
    };
  } else if (desc.includes('nhf') || desc.includes('housing fund')) {
    return {
      category: 'National Housing Fund',
      deductionType: 'NHF',
      isDeductible: true,
      confidence: 0.9
    };
  } else if (desc.includes('nhis') || desc.includes('health insurance')) {
    return {
      category: 'Health Insurance',
      deductionType: 'NHIS',
      isDeductible: true,
      confidence: 0.9
    };
  } else if (desc.includes('life insurance') || desc.includes('insurance premium')) {
    return {
      category: 'Life Insurance',
      deductionType: 'LIFE_INSURANCE',
      isDeductible: true,
      confidence: 0.8
    };
  } else if (desc.includes('rent') && !desc.includes('business')) {
    return {
      category: 'Rent',
      deductionType: 'RENT_RELIEF',
      isDeductible: true,
      confidence: 0.7
    };
  } else if (desc.includes('business') && desc.includes('rent')) {
    return {
      category: 'Business Rent',
      deductionType: 'BUSINESS_RENT',
      isDeductible: true,
      confidence: 0.8
    };
  } else if (desc.includes('salary') || desc.includes('wage') || desc.includes('employee')) {
    return {
      category: 'Employee Compensation',
      deductionType: 'EMPLOYEE_SALARIES',
      isDeductible: true,
      confidence: 0.8
    };
  } else if (desc.includes('repair') || desc.includes('maintenance')) {
    return {
      category: 'Maintenance',
      deductionType: 'BUSINESS_MAINTENANCE',
      isDeductible: true,
      confidence: 0.7
    };
  } else {
    return {
      category: 'Uncategorized',
      deductionType: 'NON_DEDUCTIBLE',
      isDeductible: false,
      confidence: 0.3
    };
  }
};

