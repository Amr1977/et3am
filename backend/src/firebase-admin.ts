export const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'et3am26',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@et3am26.iam.gserviceaccount.com',
};
