'use client';
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUserStore } from '../store/useUserStore';
import Button from './ui/button/Button';
import { formatFileSize } from '../utils/formatters';
import { getCsvTemplate } from '../lib/csvParser';

interface UploadFormProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: string) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadSuccess, onUploadError }) => {
  const { user } = useUserStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
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
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      onUploadError?.('Please select a file and ensure you are logged in.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setProgressStep('Preparing upload...');

    try {
      console.log('Starting CSV upload for user:', user.uid);
      console.log('Selected file:', selectedFile.name, selectedFile.size);
      
      // Step 1: Upload file
      setProgressStep('Uploading file...');
      setUploadProgress(20);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.uid);

      console.log('Sending request to /api/upload...');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Step 2: Processing
      setProgressStep('Processing CSV data...');
      setUploadProgress(50);
      
      // Step 3: Parsing transactions
      setProgressStep('Parsing transactions...');
      setUploadProgress(70);
      
      // Step 4: Saving to database
      setProgressStep('Saving to database...');
      setUploadProgress(90);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        console.log('Upload successful:', result);
        setProgressStep('Complete!');
        setUploadProgress(100);
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onUploadSuccess?.(result);
        setSelectedFile(null);
      } else {
        console.error('Upload failed:', result);
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setProgressStep('');
    }
  };

  const downloadTemplate = () => {
    const template = getCsvTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taxmate-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Upload Transaction CSV
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload your bank statement or transaction CSV file to get started with tax calculations.
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
            </h4>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or click to browse files
            </p>
            
            <Button variant="outline" size="sm">
              Choose File
            </Button>
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>{progressStep}</span>
              </span>
              <span className="font-medium">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Processing your CSV file... This may take a few moments.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
          >
            Download Template
          </Button>
          
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            size="sm"
          >
            {isUploading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            CSV Format Requirements:
          </h5>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Required columns: date, description, amount, type</li>
            <li>• Optional columns: category, source, isDeductible</li>
            <li>• Type should be &quot;income&quot; or &quot;expense&quot;</li>
            <li>• Date format: YYYY-MM-DD</li>
            <li>• Amount should be numeric (no currency symbols)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
