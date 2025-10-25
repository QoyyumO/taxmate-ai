import { auth } from './firebase';

/**
 * Diagnostic function to check Firebase configuration
 */
export const diagnoseFirebase = () => {
  console.log('🔍 Firebase Diagnostics');
  console.log('====================');
  
  // Check environment variables
  const envVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  console.log('📋 Environment Variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${key}: MISSING`);
    }
  });
  
  // Check Firebase Auth configuration
  console.log('\n🔐 Firebase Auth Configuration:');
  console.log('Auth Domain:', auth.config.authDomain);
  console.log('API Key:', auth.config.apiKey ? `${auth.config.apiKey.substring(0, 10)}...` : 'MISSING');
  console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  
  // Check for common issues
  console.log('\n🚨 Common Issues:');
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.log('❌ Missing API Key - Check your .env.local file');
  }
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    console.log('❌ Missing Auth Domain - Check your .env.local file');
  }
  
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.log('❌ Missing Project ID - Check your .env.local file');
  }
  
  // Check if running in browser
  if (typeof window === 'undefined') {
    console.log('⚠️ Running on server side - some checks may not apply');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. Check your .env.local file has all required variables');
  console.log('2. Restart your development server after changing .env.local');
  console.log('3. Verify your Firebase project settings');
  console.log('4. Check Firebase Console for any project issues');
  
  return {
    envVars,
    authConfig: {
      authDomain: auth.config.authDomain,
      apiKey: auth.config.apiKey ? `${auth.config.apiKey.substring(0, 10)}...` : 'MISSING',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }
  };
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).diagnoseFirebase = diagnoseFirebase;
}
