'use client';

import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUserStore } from '../store/useUserStore';
import Button from './ui/button/Button';

interface MultimodalUploaderProps {
  onAnalysisComplete?: (data: any) => void;
  onAnalysisError?: (error: string) => void;
}

export function MultimodalUploader({ onAnalysisComplete, onAnalysisError }: MultimodalUploaderProps) {
  const { user } = useUserStore();
  const [files, setFiles] = useState<File[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
      if (fileRejections.length > 0) {
        console.warn('Some files were rejected:', fileRejections);
        onAnalysisError?.('Some files were rejected. Please check file types and try again.');
      }
    },
    [onAnalysisError]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/csv': ['.csv'],
    },
    multiple: true,
    noClick: true,
    disabled: isLoading,
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleAnalyze = async () => {
    if (!user) {
      onAnalysisError?.('Please log in to analyze documents.');
      return;
    }

    if (files.length === 0 && !textInput.trim()) {
      onAnalysisError?.('Please provide either text input or upload files for analysis.');
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      if (textInput.trim()) {
        formData.append('text', textInput);
      }
      
      files.forEach(file => {
        formData.append('files', file);
      });

      formData.append('userId', user.uid);

      const response = await fetch('/api/analyze-multimodal', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        onAnalysisComplete?.(result);
        // Clear inputs after successful analysis
        setFiles([]);
        setTextInput('');
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      onAnalysisError?.(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full p-6 bg-white dark:bg-[#1c1c1c] rounded-lg shadow-md border border-gray-200 dark:border-gray-700">

      {/* Text Input */}
      <div className="mb-6">
        <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Paste Transaction Data (Optional)
        </label>
        <textarea
          id="textInput"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Paste your bank statement text, transaction list, or any financial data here..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#93cc4c] focus:border-transparent dark:bg-gray-700 dark:text-white"
          rows={4}
          disabled={isLoading}
        />
      </div>

      {/* File Upload Area */}
      <div
        {...getRootProps()}
        className={`flex-grow p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ease-in-out flex flex-col items-center justify-center ${
          isDragActive 
            ? 'border-[#93cc4c] bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-[#93cc4c]'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {isDragActive ? 'Drop the files here...' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">or</p>
        <Button 
          type="button" 
          className="mt-4" 
          onClick={open} 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? 'Processing...' : 'Select Files'}
        </Button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Supports: PDF, Images, CSV, Word documents
        </p>
      </div>
      
      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
            Selected files ({files.length}):
          </h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <div className="flex items-center min-w-0">
                  <FileIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                  <span className="truncate" title={file.name}>{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(file)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Analyze Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading || (files.length === 0 && !textInput.trim())}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze with AI'
          )}
        </Button>
      </div>
    </div>
  );
}
