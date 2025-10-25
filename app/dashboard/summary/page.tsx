'use client';
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../../components/ProtectedRoute';
import Navbar from '../../../components/Navbar';
import { useUserStore } from '../../../store/useUserStore';
import { getTaxSummaries, getTransactions } from '../../../lib/firestore';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { getTaxBracketInfo, calculateTotalIncome, calculateTotalExpenses, calculateTaxableIncome, calculatePersonalIncomeTax, calculateDeductibleExpenses, calculateRentRelief, generateAITaxSummary } from '../../../lib/taxLogic';
import { generateTaxSummaryPDF } from '../../../lib/pdfExport';
import Button from '../../../components/ui/button/Button';
import type { TaxSummary, Transaction } from '../../../types/transactions';

const TaxSummaryPage: React.FC = () => {
  const { user } = useUserStore();
  const [taxSummaries, setTaxSummaries] = useState<(TaxSummary & { id: string })[]>([]);
  const [transactions, setTransactions] = useState<(Transaction & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        const [summaries, userTransactions] = await Promise.all([
          getTaxSummaries(user.uid),
          getTransactions(user.uid)
        ]);
        
        setTaxSummaries(summaries);
        setTransactions(userTransactions);
      } catch (error) {
        console.error('Error loading tax summary data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Calculate real-time values from transactions using AI-enhanced analysis
  const [aiTaxData, setAiTaxData] = useState<{
    totalIncome: number;
    totalExpenses: number;
    deductibleExpenses: number;
    rentRelief: number;
    taxableIncome: number;
    estimatedTax: number;
    aiVerifiedDeductions?: number;
    documentationVerifiedDeductions?: number;
    pendingVerificationDeductions?: number;
  } | null>(null);

  // Load AI-enhanced tax data
  useEffect(() => {
    const loadAITaxData = async () => {
      if (transactions.length > 0) {
        try {
          const aiSummary = await generateAITaxSummary(user?.uid || '', transactions);
          setAiTaxData({
            totalIncome: aiSummary.totalIncome,
            totalExpenses: aiSummary.totalExpenses,
            deductibleExpenses: aiSummary.deductibleExpenses || 0,
            rentRelief: aiSummary.rentRelief || 0,
            taxableIncome: aiSummary.taxableIncome,
            estimatedTax: aiSummary.estimatedTax,
            ...(aiSummary.aiVerifiedDeductions !== undefined && { aiVerifiedDeductions: aiSummary.aiVerifiedDeductions }),
            ...(aiSummary.documentationVerifiedDeductions !== undefined && { documentationVerifiedDeductions: aiSummary.documentationVerifiedDeductions }),
            ...(aiSummary.pendingVerificationDeductions !== undefined && { pendingVerificationDeductions: aiSummary.pendingVerificationDeductions }),
          });
        } catch (error) {
          console.error('Error loading AI tax data:', error);
          // Fallback to legacy calculation
          setAiTaxData({
            totalIncome: calculateTotalIncome(transactions),
            totalExpenses: calculateTotalExpenses(transactions),
            deductibleExpenses: calculateDeductibleExpenses(transactions),
            rentRelief: calculateRentRelief(transactions),
            taxableIncome: calculateTaxableIncome(transactions),
            estimatedTax: calculatePersonalIncomeTax(calculateTaxableIncome(transactions)),
          });
        }
      }
    };

    loadAITaxData();
  }, [transactions, user?.uid]);

  // Use AI data if available, otherwise fallback to legacy
  const totalIncome = aiTaxData?.totalIncome ?? calculateTotalIncome(transactions);
  const totalExpenses = aiTaxData?.totalExpenses ?? calculateTotalExpenses(transactions);
  const deductibleExpenses = aiTaxData?.deductibleExpenses ?? calculateDeductibleExpenses(transactions);
  const rentRelief = aiTaxData?.rentRelief ?? calculateRentRelief(transactions);
  const taxableIncome = aiTaxData?.taxableIncome ?? calculateTaxableIncome(transactions);
  const estimatedTax = aiTaxData?.estimatedTax ?? calculatePersonalIncomeTax(calculateTaxableIncome(transactions));
  
  const taxBrackets = getTaxBracketInfo(taxableIncome);

  const handleExportPDF = async () => {
    if (!user) return;

    try {
      setIsExportingPDF(true);
      
      const taxSummaryData = {
        totalIncome,
        totalExpenses,
        deductibleExpenses,
        rentRelief,
        taxableIncome,
        estimatedTax,
        taxBrackets,
        userName: user.name || 'User',
        generatedDate: new Date().toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      await generateTaxSummaryPDF(taxSummaryData);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Tax Summary
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Your tax calculations and breakdown based on Nigeria&apos;s Personal Income Tax rates.
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <Button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || transactions.length === 0}
                  size="md"
                  className="w-full sm:w-auto"
                >
                  {isExportingPDF ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-8">
              {/* Tax Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(totalIncome)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(totalExpenses)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxable Income</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(taxableIncome)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estimated Tax</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(estimatedTax)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional 2026 Tax Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deductible Expenses</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {formatCurrency(deductibleExpenses)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rent Relief (2026)</p>
                      <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(rentRelief)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Breakdown */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tax Breakdown
                </h3>
                <div className="space-y-4">
                  {taxBrackets.map((bracket, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {bracket.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bracket.rate * 100}% tax rate
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(bracket.amountInBracket)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tax: {formatCurrency(bracket.amountInBracket * bracket.rate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Verification Status */}
              {aiTaxData && (aiTaxData.aiVerifiedDeductions !== undefined || aiTaxData.documentationVerifiedDeductions !== undefined) && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    🤖 AI Verification Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiTaxData.aiVerifiedDeductions !== undefined && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">AI Verified</p>
                            <p className="text-lg font-bold text-green-900 dark:text-green-100">
                              {formatCurrency(aiTaxData.aiVerifiedDeductions)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {aiTaxData.documentationVerifiedDeductions !== undefined && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Documented</p>
                            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                              {formatCurrency(aiTaxData.documentationVerifiedDeductions)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {aiTaxData.pendingVerificationDeductions !== undefined && aiTaxData.pendingVerificationDeductions > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Review</p>
                            <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                              {formatCurrency(aiTaxData.pendingVerificationDeductions)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tax History */}
              {taxSummaries.length > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tax History
                  </h3>
                  <div className="space-y-3">
                    {taxSummaries.slice(1, 5).map((summary) => (
                      <div key={summary.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {summary.period}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(summary.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(summary.estimatedTax)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Taxable: {formatCurrency(summary.taxableIncome)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Tax Summary Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Upload your transaction data to generate a tax summary.
              </p>
              <a
                href="/dashboard/upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Bank Statement Upload
              </a>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TaxSummaryPage;
