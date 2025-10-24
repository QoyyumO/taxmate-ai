import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, Transaction, CsvUpload, TaxSummary } from '../types/transactions';

// User operations
export const createUser = async (userData: Omit<User, 'createdAt'>) => {
  try {
    // Check if user already exists
    const existingUser = await getUser(userData.uid);
    if (existingUser) {
      return existingUser.id;
    }

    // Create user document - this automatically creates the 'users' collection
    const userRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: Timestamp.now(),
    });
    
    console.log('User created successfully:', userRef.id);
    return userRef.id;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUser = async (uid: string) => {
  const userQuery = query(collection(db, 'users'), where('uid', '==', uid));
  const querySnapshot = await getDocs(userQuery);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User & { id: string };
};

// Transaction operations
export const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
  const transactionRef = await addDoc(collection(db, 'transactions'), {
    ...transactionData,
    createdAt: Timestamp.now(),
  });
  return transactionRef.id;
};

export const createTransactions = async (transactions: Omit<Transaction, 'id' | 'createdAt'>[]) => {
  const batch = transactions.map(transaction => 
    addDoc(collection(db, 'transactions'), {
      ...transaction,
      createdAt: Timestamp.now(),
    })
  );
  return Promise.all(batch);
};

export const getTransactions = async (userId: string) => {
  try {
    // First try with the composite index query
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(transactionsQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as (Transaction & { id: string })[];
  } catch (error: any) {
    // If composite index is missing, fall back to simple query
    if (error.code === 'failed-precondition') {
      console.log('Composite index missing, using fallback query');
      const fallbackQuery = query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(fallbackQuery);
      
      // Sort in memory
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as (Transaction & { id: string })[];
      
      return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    throw error;
  }
};

export const getTransactionsByPeriod = async (userId: string, startDate: Date, endDate: Date) => {
  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('date', '>=', Timestamp.fromDate(startDate)),
    where('date', '<=', Timestamp.fromDate(endDate)),
    orderBy('date', 'desc')
  );
  const querySnapshot = await getDocs(transactionsQuery);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
    createdAt: doc.data().createdAt.toDate(),
  })) as (Transaction & { id: string })[];
};

// CSV Upload operations
export const createCsvUpload = async (uploadData: Omit<CsvUpload, 'id' | 'uploadedAt'>) => {
  const uploadRef = await addDoc(collection(db, 'csvUploads'), {
    ...uploadData,
    uploadedAt: Timestamp.now(),
  });
  return uploadRef.id;
};

export const updateCsvUpload = async (uploadId: string, updates: Partial<CsvUpload>) => {
  const uploadRef = doc(db, 'csvUploads', uploadId);
  await updateDoc(uploadRef, updates);
};

export const getCsvUploads = async (userId: string) => {
  const uploadsQuery = query(
    collection(db, 'csvUploads'),
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  const querySnapshot = await getDocs(uploadsQuery);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    uploadedAt: doc.data().uploadedAt.toDate(),
  })) as (CsvUpload & { id: string })[];
};

// Tax Summary operations
export const createTaxSummary = async (summaryData: Omit<TaxSummary, 'id' | 'createdAt'>) => {
  const summaryRef = await addDoc(collection(db, 'taxSummaries'), {
    ...summaryData,
    createdAt: Timestamp.now(),
  });
  return summaryRef.id;
};

export const getTaxSummaries = async (userId: string) => {
  const summariesQuery = query(
    collection(db, 'taxSummaries'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(summariesQuery);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as (TaxSummary & { id: string })[];
};

export const getLatestTaxSummary = async (userId: string) => {
  const summariesQuery = query(
    collection(db, 'taxSummaries'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );
  const querySnapshot = await getDocs(summariesQuery);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  } as TaxSummary & { id: string };
};
