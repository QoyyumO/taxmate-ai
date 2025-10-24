# TaxMate AI - Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication with Google and Email/Password providers
4. Enable Firestore Database
5. Enable Storage
6. Get your configuration from Project Settings > General > Your apps

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables in `.env.local`

3. Run the development server:
```bash
npm run dev
```

## Features

- ✅ Firebase Authentication (Google + Email/Password)
- ✅ CSV Upload with Papaparse
- ✅ Firestore Database Integration
- ✅ Nigeria Tax Calculation Logic
- ✅ Responsive Dashboard
- ✅ Transaction Management
- ✅ Tax Summary Reports
- ✅ Zustand State Management
- ✅ Zod Validation
- ✅ Tailwind CSS Styling

## Project Structure

```
├── app/
│   ├── dashboard/          # Dashboard pages
│   ├── auth/              # Authentication pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Firebase and utility functions
├── store/                 # Zustand state management
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## CSV Format

Your CSV file should have the following columns:

**Required:**
- `date` - Transaction date (YYYY-MM-DD)
- `description` - Transaction description
- `amount` - Transaction amount (numbers only)
- `type` - Either "income" or "expense"

**Optional:**
- `category` - Transaction category
- `source` - Transaction source
- `isDeductible` - Whether expense is tax deductible (true/false)

## Tax Calculation

The app uses Nigeria's Personal Income Tax rates:
- First ₦300,000: 7%
- Next ₦300,000: 11%
- Next ₦500,000: 15%
- Above ₦1,100,000: 19%

## Getting Started

1. Set up Firebase project
2. Configure environment variables
3. Install dependencies
4. Run development server
5. Register/Login
6. Upload CSV file
7. View tax calculations
