'use client';
import React, { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navbar from '../../../components/Navbar';
import UploadForm from '../../../components/UploadForm';
import Button from '../../../components/ui/button/Button';

const UploadPage: React.FC = () => {
  const [uploadSuccess, setUploadSuccess] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadSuccess = (data: any) => {
    setUploadSuccess(data);
    setUploadError(null);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);
  };

  const handleClearMessages = () => {
    setUploadSuccess(null);
    setUploadError(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Upload CSV
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload your transaction data to calculate your tax liability.
            </p>
          </div>

          {/* Success Message */}
          {uploadSuccess && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                    Upload Successful!
                  </h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <p>
                      Successfully processed <strong>{uploadSuccess.recordCount}</strong> transactions.
                    </p>
                    <p className="mt-1">
                      Your tax summary has been updated. 
                      <a href="/dashboard" className="font-medium underline ml-1">
                        View Dashboard
                      </a>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearMessages}
                  className="ml-3 text-green-400 hover:text-green-600 dark:hover:text-green-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Upload Failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{uploadError}</p>
                  </div>
                </div>
                <button
                  onClick={handleClearMessages}
                  className="ml-3 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Upload Form */}
          <UploadForm
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              How to Prepare Your CSV File
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  1. Required Columns
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>• <strong>date</strong> - Transaction date (YYYY-MM-DD format)</li>
                  <li>• <strong>description</strong> - Transaction description</li>
                  <li>• <strong>amount</strong> - Transaction amount (numbers only)</li>
                  <li>• <strong>type</strong> - Either "income" or "expense"</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  2. Optional Columns
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                  <li>• <strong>category</strong> - Transaction category (e.g., "Salary", "Food")</li>
                  <li>• <strong>source</strong> - Transaction source (e.g., "Employer", "Bank")</li>
                  <li>• <strong>isDeductible</strong> - Whether expense is tax deductible (true/false)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  3. Example Data
                </h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm font-mono">
                  <pre className="text-gray-800 dark:text-gray-200">
{`date,description,amount,type,category,source,isDeductible
2024-01-15,Salary Payment,50000,income,Salary,Employer,false
2024-01-16,Grocery Shopping,5000,expense,Food,Supermarket,false
2024-01-17,Office Supplies,2000,expense,Office,Stationery Store,true`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default UploadPage;
