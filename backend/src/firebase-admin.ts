import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const credPath = path.join(__dirname, '../et3am26-firebase-adminsdk-fbsvc-23c302e167.json');

let fileCreds: any = null;
if (fs.existsSync(credPath)) {
  try {
    fileCreds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  } catch (e) {
    console.warn('Failed to parse Firebase credentials file');
  }
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || fileCreds?.project_id || 'et3am26',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || fileCreds?.private_key,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || fileCreds?.client_email || 'firebase-adminsdk-fbsvc@et3am26.iam.gserviceaccount.com',
};

let firebaseInitialized = false;

if (serviceAccount?.privateKey) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }
    firebaseInitialized = true;
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.warn('Firebase Admin initialization failed:', err);
  }
} else {
  console.warn('Firebase private key not configured - Google auth via Firebase will be disabled');
}

export { admin, serviceAccount, firebaseInitialized };