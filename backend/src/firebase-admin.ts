import fs from 'fs';
import path from 'path';

const credPath = path.join(__dirname, '../../et3am26-firebase-adminsdk-fbsvc-43c2de376d.json');

let fileCreds: any = null;
if (fs.existsSync(credPath)) {
  try {
    fileCreds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  } catch (e) {
    console.warn('Failed to parse Firebase credentials file');
  }
}

export const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || fileCreds?.project_id || 'et3am26',
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || fileCreds?.private_key,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || fileCreds?.client_email || 'firebase-adminsdk-fbsvc@et3am26.iam.gserviceaccount.com',
};
