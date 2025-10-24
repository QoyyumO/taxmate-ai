import { auth, db } from './firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Test function to verify Firestore rules are working
 * Run this in the browser console to test
 */
export const testFirestoreRules = async () => {
  console.log('Testing Firestore rules...');
  
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log('❌ No authenticated user found');
        resolve(false);
        return;
      }
      
      console.log('✅ User authenticated:', user.uid);
      
      try {
        // Test creating a user document
        const userRef = await addDoc(collection(db, 'users'), {
          uid: user.uid,
          name: 'Test User',
          email: user.email,
          role: 'user',
          createdAt: Timestamp.now(),
        });
        
        console.log('✅ User document created:', userRef.id);
        
        // Test reading user documents
        const usersSnapshot = await getDocs(collection(db, 'users'));
        console.log('✅ Users collection accessible, documents:', usersSnapshot.size);
        
        console.log('🎉 Firestore rules are working correctly!');
        resolve(true);
        
      } catch (error) {
        console.error('❌ Firestore rules test failed:', error);
        resolve(false);
      }
    });
  });
};

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testFirestoreRules = testFirestoreRules;
}
