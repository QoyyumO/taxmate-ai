/**
 * AI Tax Logic Configuration
 * Configuration for Amazon Bedrock integration and Nigeria Tax Act 2025
 */

export const AI_CONFIG = {
  // Google AI Studio Configuration
  googleAI: {
    apiKey: process.env.GOOGLE_AI_STUDIO_API_KEY || '',
    model: process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash-lite',
    maxTokens: 1000,
    temperature: 0.1, // Low temperature for consistent tax analysis
  },
  
  // Nigeria Tax Act 2025 Configuration
  taxAct: {
    // Deductible expense keywords for AI detection
    deductibleKeywords: [
      'pension', 'nhf', 'nhis', 'life insurance', 'medical insurance', 
      'rent', 'house loan interest', 'r&d', 'repair', 'maintenance', 
      'bad debt', 'employee benefit', 'disability', 'assistive device',
      'research', 'development', 'business rent', 'salaries', 'wages'
    ],
    
    // Rent relief configuration
    rentRelief: {
      percentage: 0.20, // 20% of annual rent
      maxAmount: 500000, // ₦500,000 cap
      keywords: ['rent', 'accommodation', 'housing', 'lease']
    },
    
    // Tax brackets (Nigeria Tax Act 2025)
    taxBrackets: [
      { min: 0, max: 800000, rate: 0 },
      { min: 800000, max: 3000000, rate: 0.15 },
      { min: 3000000, max: 12000000, rate: 0.18 },
      { min: 12000000, max: 25000000, rate: 0.21 },
      { min: 25000000, max: 50000000, rate: 0.23 },
      { min: 50000000, max: Infinity, rate: 0.25 }
    ],
    
    // Documentation requirements
    documentationTypes: [
      'receipt',
      'pension_slip', 
      'rent_agreement',
      'insurance_policy',
      'loan_document'
    ],
    
    // AI confidence thresholds
    confidenceThresholds: {
      high: 0.8,
      medium: 0.6,
      low: 0.4
    }
  },
  
  // Error handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    fallbackToManual: true
  }
};

/**
 * Get AI prompt template for transaction analysis
 */
export const getTransactionAnalysisPrompt = (transaction: any) => {
  return `Analyze: "${transaction.description}" - ₦${transaction.amount?.toLocaleString() || '0'}

Return JSON:
{
  "isVerified": true,
  "confidence": 0.8,
  "reasoning": "brief explanation",
  "suggestedDeductionType": "PENSION"
}`;
};

/**
 * Get AI prompt template for expense categorization
 */
export const getExpenseCategorizationPrompt = (description: string, amount: number) => {
  return `Categorize: "${description}" - ₦${amount.toLocaleString()}

Return JSON:
{
  "category": "Pension",
  "deductionType": "PENSION",
  "isDeductible": true,
  "confidence": 0.8
}`;
};
