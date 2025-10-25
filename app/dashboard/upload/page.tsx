'use client';
import React, { useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navbar from '../../../components/Navbar';
import { MultimodalUploader } from '../../../components/MultimodalUploader';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';

const UploadPage: React.FC = () => {
  const [uploadSuccess, setUploadSuccess] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const handleUploadSuccess = (data: any) => {
    console.log('Upload success callback:', data);
    setUploadSuccess(data);
    setUploadError(null);
    setShowSuccessModal(true);
  };

  const handleUploadError = (error: string) => {
    console.log('Upload error callback:', error);
    setUploadError(error);
    setUploadSuccess(null);
    setShowErrorModal(true);
  };


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bank Statement Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload bank statements, receipts, or paste transaction data. Our AI will extract and analyze all transactions automatically.
            </p>
          </div>

          {/* Multimodal Uploader */}
          <MultimodalUploader
            onAnalysisComplete={handleUploadSuccess}
            onAnalysisError={handleUploadError}
          />

          {/* Success Modal */}
          <Modal
            isOpen={showSuccessModal}
            onClose={() => setShowSuccessModal(false)}
            className="max-w-md mx-4"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Successful!
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Successfully processed <strong>{uploadSuccess?.recordCount || uploadSuccess?.transactionCount}</strong> transactions.
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Your tax summary has been updated and is ready for calculations.
                </p>
              </div>
              
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => window.location.href = '/dashboard'}
                      className="flex-1"
                    >
                      View Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setShowSuccessModal(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Close
                    </Button>
                  </div>
            </div>
          </Modal>

          {/* Error Modal */}
          <Modal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            className="max-w-md mx-4"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Failed
                  </h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  {uploadError}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                  Please check your file format and try again. For PDF files, ensure they contain readable text.
                </p>
              </div>
              
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => setShowErrorModal(false)}
                      className="flex-1"
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setShowErrorModal(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Close
                    </Button>
                  </div>
            </div>
          </Modal>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default UploadPage;