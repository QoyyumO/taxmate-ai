import { NextRequest, NextResponse } from 'next/server';
import { parseCsvFile } from '../../../lib/csvParser';
import { createTransactions, createCsvUpload, updateCsvUpload } from '../../../lib/firestore';
import { generateTaxSummary } from '../../../lib/taxLogic';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Create CSV upload record
    const uploadId = await createCsvUpload({
      userId,
      fileName: file.name,
      fileUrl: '', // Will be updated after upload
      recordCount: 0,
      status: 'processing',
    });

    try {
      let fileUrl = '';
      
      // Try to upload file to Firebase Storage (optional)
      try {
        const storageRef = ref(storage, `csv-uploads/${userId}/${Date.now()}-${file.name}`);
        const fileBuffer = await file.arrayBuffer();
        const uploadResult = await uploadBytes(storageRef, fileBuffer);
        fileUrl = await getDownloadURL(uploadResult.ref);
        console.log('File uploaded to storage:', fileUrl);
      } catch (storageError) {
        console.warn('Storage upload failed, continuing without file URL:', storageError);
        // Continue without storage upload
      }

      // Parse CSV file
      console.log('Parsing CSV file...');
      let parsedTransactions;
      try {
        parsedTransactions = await parseCsvFile(file);
        console.log('Parsed transactions:', parsedTransactions.length);
        
        if (parsedTransactions.length === 0) {
          throw new Error('No valid transactions found in CSV file');
        }
      } catch (parseError) {
        console.error('CSV parsing failed:', parseError);
        await updateCsvUpload(uploadId, {
          status: 'failed',
        });
        return NextResponse.json(
          { 
            error: `CSV parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            success: false 
          },
          { status: 400 }
        );
      }

      // Create transactions in Firestore
      console.log('Creating transactions in Firestore...');
      try {
        const transactionData = parsedTransactions.map(transaction => ({
          userId,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          source: transaction.source,
          isDeductible: transaction.isDeductible,
        }));

        await createTransactions(transactionData);
        console.log('Transactions created successfully');

        // Update CSV upload record
        await updateCsvUpload(uploadId, {
          fileUrl,
          recordCount: parsedTransactions.length,
          status: 'completed',
        });

        // Generate tax summary
        const taxSummary = generateTaxSummary(userId, transactionData);

        return NextResponse.json({
          success: true,
          uploadId,
          recordCount: parsedTransactions.length,
          taxSummary,
        });
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        await updateCsvUpload(uploadId, {
          status: 'failed',
        });
        return NextResponse.json(
          { 
            error: `Database operation failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
            success: false 
          },
          { status: 500 }
        );
      }

    } catch (error) {
      console.error('Upload processing error:', error);
      
      // Update upload status to failed
      try {
        await updateCsvUpload(uploadId, {
          status: 'failed',
        });
      } catch (updateError) {
        console.error('Failed to update upload status:', updateError);
      }

      return NextResponse.json(
        { 
          error: `Upload processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          success: false 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
