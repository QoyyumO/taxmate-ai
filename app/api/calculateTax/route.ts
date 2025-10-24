import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, createTaxSummary } from '../../../lib/firestore';
import { generateTaxSummary } from '../../../lib/taxLogic';

export async function POST(request: NextRequest) {
  try {
    const { userId, period } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get transactions for the user
    const transactions = await getTransactions(userId);

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found' },
        { status: 404 }
      );
    }

    // Generate tax summary
    const taxSummaryData = generateTaxSummary(userId, transactions, period);

    // Save tax summary to Firestore
    const summaryId = await createTaxSummary(taxSummaryData);

    return NextResponse.json({
      success: true,
      summaryId,
      taxSummary: taxSummaryData,
    });

  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tax calculation failed' },
      { status: 500 }
    );
  }
}
