'use client';
import Link from 'next/link';
import { useUserStore } from '../store/useUserStore';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUser, createUser } from '../lib/firestore';
import '../lib/test-firestore'; // Import test function
import '../lib/firebase-diagnostics'; // Import diagnostics
import type { User } from '../types/transactions';

export default function Home() {
  const { setUser, isAuthenticated } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await getUser(firebaseUser.uid);
          if (userData) {
            setUser(userData);
          } else {
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'user',
              createdAt: new Date(),
            };
            
            try {
              await createUser(newUser);
              console.log('User document created in Home page');
            } catch (createError) {
              console.error('Error creating user document:', createError);
              // Continue with authentication even if document creation fails
            }
            
            setUser(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050a06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to <span className='text-[#5d2360]'> TaxMate AI </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Your AI-powered tax assistant is ready to help you calculate your tax liability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 font-semibold bg-[#93cc4c] text-black rounded-lg hover:bg-[#92cc4cd5] transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center px-6 py-3 bg-[#5d2360] font-semibold text-white rounded-lg hover:bg-[#5d2360ca] transition-colors"
              >
                Upload Bank Statement
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-blue-50 to-indigo-100 bg-[#050a06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#5d2360] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TM</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                TaxMate AI
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-[#5d2360] dark:text-gray-300 font-semibold dark:hover:text-[#5d2360] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="bg-[#93cc4c] font-semibold text-black px-4 py-2 rounded-lg hover:bg-[#92cc4cd2] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Powered Tax Assistant
              <span className="block text-[#5d2360]">for Nigeria</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Simplify your tax calculations with intelligent insights. Upload your transaction data 
              and get accurate tax estimates based on Nigeria&apos;s Personal Income Tax rates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 bg-[#93cc4c] text-black rounded-lg hover:bg-[#92cc4cd4] transition-colors text-lg font-semibold"
              >
                Start Free Trial
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-50 transition-colors text-lg font-semibold border border-gray-300"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Features */}
          <div id="features" className="py-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Why Choose TaxMate AI?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-[#1d1d1d] rounded-lg shadow-sm border border-gray-200 dark:border-slate-900 p-6">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Accurate Tax Calculations
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get precise tax estimates based on Nigeria&apos;s Personal Income Tax rates and brackets.
                </p>
              </div>

              <div className="bg-white dark:bg-[#1d1d1d] rounded-lg shadow-sm border border-gray-200 dark:border-slate-900 p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Easy Bank Statement Upload
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Simply upload your bank statement or transaction CSV file and let AI do the rest.
                </p>
              </div>

              <div className="bg-white dark:bg-[#1d1d1d] rounded-lg shadow-sm border border-gray-200 dark:border-slate-900 p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Smart Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get detailed breakdowns of your tax liability with actionable insights and recommendations.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-[#5d2360] rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Simplify Your Taxes?
            </h2>
            <p className="text-blue-100 mb-6 text-lg">
              Join thousands of Nigerians who trust TaxMate AI for their tax calculations.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-[#93cc4c] text-black rounded-lg hover:bg-gray-100 transition-colors text-lg font-semibold"
            >
              Get Started Now
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
