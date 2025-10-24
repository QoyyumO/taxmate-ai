import { NextRequest, NextResponse } from 'next/server';
import { processBankStatementPDF } from '../../../lib/pdfExtractor';

export async function POST(request: NextRequest) {
  try {
    console.log('PDF processing API called');
    
    // Check if Groq API key is available
    if (!process.env.GROQ_API_KEY) {
      console.error('Groq API key not found');
      return NextResponse.json(
        { 
          error: 'Groq API key not configured',
          details: 'Please add GROQ_API_KEY to your environment variables'
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile') as File;

    console.log('PDF file received:', pdfFile?.name, 'Size:', pdfFile?.size);

    if (!pdfFile) {
      console.error('No PDF file provided');
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!pdfFile.type.includes('pdf')) {
      console.error('Invalid file type:', pdfFile.type);
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Check file size (limit to 10MB)
    if (pdfFile.size > 10 * 1024 * 1024) {
      console.error('File too large:', pdfFile.size);
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    console.log('Starting PDF processing...');
    const result = await processBankStatementPDF(pdfFile);
    console.log('PDF processing completed successfully');

    // Get userId from request body or headers
    const userId = formData.get('userId') as string;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Store transactions in Firestore
    try {
      const { addTransactions, addCsvUpload } = await import('../../../lib/firestore');
      
      // Convert bank data to transaction format
      const transactions = result.bankData.transactions.map(transaction => ({
        userId: userId,
        date: new Date(transaction.date),
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: 'Bank Transaction',
        source: 'pdf_upload',
        isDeductible: false,
        createdAt: new Date(),
      }));

      // Store transactions in Firestore
      await addTransactions(transactions);

      // Store CSV upload metadata
      await addCsvUpload({
        userId: userId,
        fileName: pdfFile.name,
        fileUrl: '', // PDF files are processed, not stored
        recordCount: result.transactionCount,
        status: 'completed',
      });

      console.log(`Stored ${result.transactionCount} transactions in Firestore`);
    } catch (dbError) {
      console.error('Error storing transactions in database:', dbError);
      // Continue with response even if database storage fails
    }

    return NextResponse.json({
      success: true,
      csvData: result.csvData,
      bankData: result.bankData,
      transactionCount: result.transactionCount,
      message: `Successfully extracted ${result.transactionCount} transactions from bank statement`
    });

  } catch (error) {
    console.error('PDF processing error:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'Groq API key is invalid or expired',
            details: 'Please check your GROQ_API_KEY environment variable'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Groq API quota exceeded or rate limited',
            details: 'Please check your API usage limits in Groq console'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('AI')) {
        return NextResponse.json(
          { 
            error: 'AI processing failed',
            details: 'The AI could not parse the bank statement. Please ensure the PDF contains clear, readable text.'
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process PDF',
        details: 'Please ensure your PDF contains readable text and try again'
      },
      { status: 500 }
    );
  }
}
