import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '../../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
      // Upload file to Firebase Storage
      const storageRef = ref(storage, `csv-uploads/${userId}/${Date.now()}-${file.name}`);
      const fileBuffer = await file.arrayBuffer();
      const uploadResult = await uploadBytes(storageRef, fileBuffer);
      const fileUrl = await getDownloadURL(uploadResult.ref);

      // Parse CSV file
      const parsedTransactions = await parseCsvFile(file);

      // Create transactions in Firestore
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

    } catch (error) {
      // Update upload status to failed
      await updateCsvUpload(uploadId, {
        status: 'failed',
      });

      throw error;
    }

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
