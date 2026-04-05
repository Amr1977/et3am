import * as admin from 'firebase-admin';
import * as path from 'path';

let serviceAccount: any = null;
try {
  serviceAccount = require('../et3am26-firebase-adminsdk-fbsvc-23c302e167.json');
  console.log('Service account loaded successfully');
} catch (err) {
  console.error('Failed to load service account:', err);
}

const firebaseInitialized = admin.apps.length > 0;

if (!firebaseInitialized && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: "et3am26"
  });
  console.log('Firebase Admin initialized with projectId: et3am26');
  console.log("🔥 ADMIN PROJECT:", admin.app().options.projectId);
} else if (firebaseInitialized) {
  console.log("Firebase already initialized");
  console.log("🔥 ADMIN PROJECT:", admin.app().options.projectId);
} else {
  console.error("Firebase private key not configured - Google auth will be disabled");
}

export { admin, firebaseInitialized, serviceAccount };