'use client';
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUserStore } from '../store/useUserStore';
import Button from './ui/button/Button';
import { formatFileSize } from '../utils/formatters';

interface PDFUploadFormProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: string) => void;
}

const PDFUploadForm: React.FC<PDFUploadFormProps> = ({ onUploadSuccess, onUploadError }) => {
  const { user } = useUserStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  const handlePDFProcessing = async () => {
    if (!selectedFile || !user) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      formData.append('pdfFile', selectedFile);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      console.log('Sending PDF to processing API...');
      formData.append('userId', user.uid); // Add userId to form data
      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        onUploadSuccess?.(result);
        setSelectedFile(null);
      } else {
        throw new Error(result.error || 'PDF processing failed');
      }
    } catch (error) {
      console.error('PDF processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'PDF processing failed';
      onUploadError?.(errorMessage);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upload Bank Statement PDF
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload your bank statement PDF and AI will automatically extract transaction data.
          </p>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM7 3h10a2 2 0 012 2v4H5V5a2 2 0 012-2z"
                />
              </svg>
            </div>
            
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop your bank statement PDF here'}
            </h4>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or click to browse files
            </p>
            
            <Button variant="outline" size="sm">
              Choose PDF File
            </Button>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Processing PDF with AI...</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Extracting transaction data from your bank statement...
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Supported: PDF bank statements</p>
            <p>Max size: 10MB</p>
          </div>
          
          <Button
            onClick={handlePDFProcessing}
            disabled={!selectedFile || isProcessing}
            size="sm"
          >
            {isProcessing ? 'Processing...' : 'Extract Transactions'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            How it works:
          </h5>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Upload your bank statement PDF</li>
            <li>• AI extracts transaction data automatically</li>
            <li>• Supports all major Nigerian banks</li>
            <li>• Handles different statement formats</li>
            <li>• Converts to CSV for tax calculations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFUploadForm;
