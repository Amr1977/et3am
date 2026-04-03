import admin from 'firebase-admin';
import { serviceAccount } from './firebase-admin';

let firestoreInitialized = false;
let db: admin.firestore.Firestore | null = null;

export function initFirestore(): admin.firestore.Firestore | null {
  if (db) return db;
  
  if (!serviceAccount?.privateKey) {
    console.warn('Firebase private key not configured - Firestore will be disabled');
    return null;
  }

  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }
    db = admin.firestore();
    firestoreInitialized = true;
    console.log('Firestore initialized');
    return db;
  } catch (err) {
    console.warn('Firestore initialization failed:', err);
    return null;
  }
}

export function isFirestoreInitialized(): boolean {
  return firestoreInitialized;
}

export { db };
