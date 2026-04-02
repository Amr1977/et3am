import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
const db = getFirestore(app);

export { db };
export default firebaseConfig;
