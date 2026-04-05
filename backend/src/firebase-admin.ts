import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(__dirname, '..', 'et3am26-firebase-adminsdk-fbsvc-7af0882bd6.json');
let serviceAccount: admin.ServiceAccount | null = null;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);
    console.log('Service account loaded successfully');
  } catch (err) {
    console.error('Failed to parse service account JSON:', err);
  }
} else {
  console.error('Service account file not found at:', serviceAccountPath);
}

if (admin.apps.length === 0 && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "et3am26"
  });
  console.log('Firebase Admin initialized with projectId: et3am26');
  console.log("🔥 ADMIN PROJECT:", admin.app().options.projectId);
} else if (admin.apps.length > 0) {
  console.log("Firebase already initialized");
  console.log("🔥 ADMIN PROJECT:", admin.app().options.projectId);
} else {
  console.error("Firebase private key not configured - Google auth will be disabled");
}

const firebaseInitialized = admin.apps.length > 0;

export { admin, firebaseInitialized, serviceAccount };