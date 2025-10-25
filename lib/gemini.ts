import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Transaction } from '../types/transactions';

// Ensure the API key is available from environment variables
const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_AI_STUDIO_API_KEY is not set in the environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Extracts transactions from a combination of text and file content using a multimodal AI model.
 * @param contentParts - An array of Parts (text or inlineData for files) to be analyzed.
 * @returns A promise that resolves to an array of Transaction objects.
 */
export async function extractTransactionsFromContent(
  contentParts: any[]
): Promise<Transaction[]> {
  try {
    // Use Gemini 2.0 Flash Lite for better performance
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
    });

    // Comprehensive prompt for Nigerian tax context
    const prompt = `You are an expert financial analyst specializing in Nigerian tax law and bank statement analysis. Analyze the provided content, which may include pasted text, PDF documents, and images of financial statements or receipts. Your task is to meticulously extract every transaction you can find from all the provided sources.

    Follow these instructions carefully:
    1. Combine all transactions from all inputs (text and files) into a single list.
    2. Present the extracted data as a single, valid JSON array.
    3. Each object in the array must represent one transaction and have these exact keys: "date", "description", "amount", "type".
    4. For the "type" field, use "income" for money coming in (credits, deposits, salary) and "expense" for money going out (debits, payments, purchases).
    5. Standardize the date into 'YYYY-MM-DD' format if possible.
    6. For Nigerian bank statements, recognize common transaction patterns:
       - Salary payments, transfers, ATM withdrawals, POS purchases
       - Bank charges, interest payments, loan disbursements
       - Rent payments, utility bills, subscription services
    7. The final output must ONLY be the JSON array. Do not include any other text, explanations, or markdown formatting.

    Example format:
    [
      {
        "date": "2024-01-15",
        "description": "SALARY CREDIT",
        "amount": 150000,
        "type": "income"
      },
      {
        "date": "2024-01-16", 
        "description": "ATM WITHDRAWAL",
        "amount": 5000,
        "type": "expense"
      }
    ]`;

    // Generate content using the SDK with the prompt and all content parts
    const result = await model.generateContent([prompt, ...contentParts]);
    const response = await result.response;
    const jsonText = response.text();

    if (!jsonText) {
      console.error('Gemini response was empty or malformed:', response);
      throw new Error('The AI returned an empty analysis. The document might be unreadable.');
    }

    // Clean and parse the response to ensure it's valid JSON
    const trimmedText = jsonText.replace(/```json\n|```/g, '').trim();
    const startIndex = trimmedText.indexOf('[');
    const endIndex = trimmedText.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1) {
      console.error('AI response was not a valid JSON array:', trimmedText);
      throw new Error('Failed to parse transactions. The document format may be too complex.');
    }

    const cleanJson = trimmedText.substring(startIndex, endIndex + 1);

    try {
      const parsedTransactions = JSON.parse(cleanJson);
      
      // Validate and transform the transactions
      return parsedTransactions.map((transaction: any, index: number) => ({
        id: `ai-${Date.now()}-${index}`,
        userId: '', // Will be set by the API
        date: new Date(transaction.date || new Date()),
        description: transaction.description || 'Unknown transaction',
        amount: Math.abs(parseFloat(transaction.amount) || 0),
        type: transaction.type === 'income' ? 'income' : 'expense',
        category: 'AI Extracted',
        source: 'multimodal_upload',
        isDeductible: false, // Will be determined by AI analysis
        createdAt: new Date(),
      }));
    } catch (parseError) {
      console.error('JSON Parse Error on AI output:', parseError, 'Raw AI Text:', cleanJson);
      throw new Error('Failed to read the AI analysis. Please ensure the document is clear and try again.');
    }

  } catch (error: any) {
    console.error('Error in extractTransactionsFromContent:', error);
    
    if (error.message.includes('API_KEY')) {
      throw new Error('Invalid Google AI API key. Please check your .env.local file.');
    }
    if (error.message.includes('quota') || error.message.includes('429')) {
      throw new Error('API usage limit exceeded. Please check your quota and billing.');
    }

    throw new Error('An unexpected error occurred while processing your documents with the AI.');
  }
}
