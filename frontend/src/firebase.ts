import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI",
  authDomain: "et3am26.firebaseapp.com",
  projectId: "et3am26",
  storageBucket: "et3am26.firebasestorage.app",
  messagingSenderId: "119582207501",
  appId: "1:119582207501:web:38dc0c5e6af37acd092f44",
  measurementId: "G-VNPG7VYC44"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}

const DEPLOYMENTS_COLLECTION = 'deployments';
const FRONTEND_DOC_ID = 'frontend';

export async function getFrontendDeployCommit(): Promise<string | null> {
  try {
    const docRef = doc(db, DEPLOYMENTS_COLLECTION, FRONTEND_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().commit || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setFrontendDeployCommit(commit: string): Promise<void> {
  try {
    const docRef = doc(db, DEPLOYMENTS_COLLECTION, FRONTEND_DOC_ID);
    await setDoc(docRef, {
      commit,
      deployedAt: Date.now(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to set frontend deploy commit:', err);
  }
}

export { db, auth, firebaseConfig };
export default firebaseConfig;
