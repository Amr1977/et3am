import admin from 'firebase-admin';
import { serviceAccount } from './firebase-admin';

let firestoreInitialized = false;
let db: admin.firestore.Firestore | null = null;

export function initFirestore(): admin.firestore.Firestore | null {
  if (db) return db;
  
  if (!serviceAccount || !(serviceAccount as any).private_key) {
    console.warn('Firebase private key not configured - Firestore will be disabled');
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      projectId: "et3am26"
    });
  }
  
  if (admin.apps.length > 0) {
    db = admin.firestore();
    firestoreInitialized = true;
    console.log('Firestore initialized');
    return db;
  }
  
  console.warn('Firestore initialization failed - no Firebase app');
  return null;
}

export function isFirestoreInitialized(): boolean {
  return firestoreInitialized;
}

export { db };
