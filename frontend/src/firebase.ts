import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLY_brAiwgZx8Z2NOKNvGNN05l3hIoaXQ",
  authDomain: "foodshare777.firebaseapp.com",
  projectId: "foodshare777",
  storageBucket: "foodshare777.firebasestorage.app",
  messagingSenderId: "275086967374",
  appId: "1:275086967374:web:e21931c54d3b1b199e791f",
  measurementId: "G-YY5QP2X2XP"
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
