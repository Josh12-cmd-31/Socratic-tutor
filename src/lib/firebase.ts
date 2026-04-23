import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig as any);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Connectivity Test - Improved for debugging
async function testConnection() {
  try {
    // Attempt a lightweight check
    await getDocFromServer(doc(db, 'system', 'health-check'));
  } catch (error: any) {
    console.warn("Firebase Connectivity Note:", error.message);
    if (error.message.includes('offline') || error.code === 'unavailable') {
      console.error(
        "CRITICAL: Firestore is unable to connect. Please ensure:\n" +
        "1. You have created a Firestore database in your Firebase Console (socratic-ai-d0a93).\n" +
        "2. The database is initialized in 'Production' or 'Test' mode.\n" +
        "3. Your API Key is valid and doesn't have domain restrictions."
      );
    }
  }
}
// We run this as a background check to not block the main UI
testConnection();

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null): never {
  const authInfo = {
    userId: auth.currentUser?.uid || 'anonymous',
    email: auth.currentUser?.email || 'none',
    emailVerified: auth.currentUser?.emailVerified || false,
    isAnonymous: auth.currentUser?.isAnonymous || true,
    providerInfo: auth.currentUser?.providerData.map(p => ({
      providerId: p.providerId,
      displayName: p.displayName || '',
      email: p.email || ''
    })) || []
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error.message || 'Unknown Firestore error',
    operationType,
    path,
    authInfo
  };

  throw new Error(JSON.stringify(errorInfo));
}
