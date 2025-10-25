import { NextRequest, NextResponse } from 'next/server';
import { extractTransactionsFromContent } from '../../../lib/gemini';
import { createTransactions } from '../../../lib/firestore';
import { generateTaxSummary } from '../../../lib/taxLogic';

// Helper function to convert a File object into a Google Generative AI Part
async function fileToGenerativePart(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    inlineData: {
      mimeType: file.type,
      data: buffer.toString('base64'),
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const textInput = formData.get('text') as string | null;
    const files = formData.getAll('files') as File[];
    const userId = formData.get('userId') as string;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!textInput && files.length === 0) {
      return NextResponse.json(
        { error: 'No text or files were provided for analysis.' },
        { status: 400 }
      );
    }

    console.log('Starting multimodal analysis...', {
      hasText: !!textInput,
      fileCount: files.length,
      userId
    });

    const contentParts: any[] = [];

    // Add the text part if it exists and is not empty
    if (textInput && textInput.trim()) {
      contentParts.push({ text: textInput });
    }

    // Process and add file parts
    for (const file of files) {
      console.log('Processing file:', file.name, file.type, file.size);
      const part = await fileToGenerativePart(file);
      contentParts.push(part);
    }

    // Call the Gemini function with the combined content
    const transactions = await extractTransactionsFromContent(contentParts);

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Could not extract any transactions from the provided content.' },
        { status: 400 }
      );
    }

    console.log('Extracted transactions:', transactions.length);

    // Add userId to all transactions
    const transactionsWithUserId = transactions.map(transaction => ({
      ...transaction,
      userId,
    }));

    // Store transactions in Firestore
    await createTransactions(transactionsWithUserId);
    console.log('Transactions stored in Firestore');

    // Generate tax summary
    const taxSummary = generateTaxSummary(userId, transactionsWithUserId);

    return NextResponse.json({
      success: true,
      transactionCount: transactions.length,
      transactions: transactions.slice(0, 10), // Return first 10 for preview
      taxSummary,
      message: `Successfully extracted ${transactions.length} transactions and calculated tax summary.`
    });

  } catch (error: any) {
    console.error('Multimodal analysis error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'An unexpected error occurred during processing.',
        success: false 
      },
      { status: 500 }
    );
  }
}
