'use client';
import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import { DashboardSummaryCards } from '../../components/SummaryCard';
import { useUserStore } from '../../store/useUserStore';
import { getTransactions } from '../../lib/firestore';
import { calculateTotalIncome, calculateTotalExpenses, calculateTaxableIncome, calculatePersonalIncomeTax } from '../../lib/taxLogic';
import type { Transaction, DashboardSummary } from '../../types/transactions';

const DashboardPage: React.FC = () => {
  const { user } = useUserStore();
  const [transactions, setTransactions] = useState<(Transaction & { id: string })[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // Load transactions
        const userTransactions = await getTransactions(user.uid);
        setTransactions(userTransactions);

        // Calculate summary
        const totalIncome = calculateTotalIncome(userTransactions);
        const totalExpenses = calculateTotalExpenses(userTransactions);
        const taxableIncome = calculateTaxableIncome(userTransactions);
        const estimatedTax = calculatePersonalIncomeTax(taxableIncome);

        const dashboardSummary: DashboardSummary = {
          totalIncome,
          totalExpenses,
          estimatedTax,
          netIncome: totalIncome - totalExpenses,
        };

        setSummary(dashboardSummary);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set empty state on error
        setTransactions([]);
        setSummary({
          totalIncome: 0,
          totalExpenses: 0,
          estimatedTax: 0,
          netIncome: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleRecalculateTax = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/calculateTax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        }),
      });

      if (response.ok) {
        // Reload dashboard data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error recalculating tax:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.name}! Here&apos;s your tax overview.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <DashboardSummaryCards summary={summary || {
              totalIncome: 0,
              totalExpenses: 0,
              estimatedTax: 0,
              netIncome: 0,
            }} isLoading={isLoading} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <a
                  href="/dashboard/upload"
                  className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload New CSV
                </a>
                <button
                  onClick={handleRecalculateTax}
                  className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Recalculate Tax
                </button>
                <a
                  href="/dashboard/transactions"
                  className="block w-full bg-gray-600 text-white text-center py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View All Transactions
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.date.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        transaction.type === 'income' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'expense' ? '-' : '+'}
                        ₦{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transaction.type}
                      </p>
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No transactions yet. Upload a CSV to get started.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tax Information */}
          {summary && summary.estimatedTax > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Tax Information
              </h3>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                Based on Nigeria&apos;s Personal Income Tax rates, your estimated tax liability is{' '}
                <span className="font-semibold">₦{summary.estimatedTax.toLocaleString()}</span>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 dark:text-blue-300">Taxable Income</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    ₦{(summary.totalIncome - summary.totalExpenses).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-blue-300">Tax Rate</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {((summary.estimatedTax / (summary.totalIncome - summary.totalExpenses)) * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 dark:text-blue-300">Effective Rate</p>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    {((summary.estimatedTax / summary.totalIncome) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
