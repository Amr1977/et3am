#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "Error: frontend directory not found"
    exit 1
fi

echo "=== Checking frontend deployment status ==="

cd "$FRONTEND_DIR"

COMMIT_HASH=$(git rev-parse HEAD)
echo "Current commit: $COMMIT_HASH"

if [ ! -f "node_modules/.bin/firebase" ]; then
    echo "Installing Firebase tools..."
    npm install --no-progress firebase-tools
fi

FIRESTORE_CHECK=$(npx firebase apps:list --project et3am26 2>/dev/null | grep -q "et3am26" && echo "ok" || echo "fail")

if [ "$FIRESTORE_CHECK" != "ok" ]; then
    echo "Warning: Cannot verify Firebase project, proceeding with deploy..."
    echo "Building frontend..."
    npm run build
    echo "Deploying to Firebase..."
    npx firebase deploy --only hosting --project et3am26 --token "$FIREBASE_TOKEN"
    exit 0
fi

echo "Fetching last deployed commit from Firestore..."

LAST_COMMIT=$(node -e "
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const config = {
  apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
  authDomain: 'et3am26.firebaseapp.com',
  projectId: 'et3am26',
  storageBucket: 'et3am26.firebasestorage.app',
  messagingSenderId: '119582207501',
  appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
};
const app = initializeApp(config);
const db = getFirestore(app);
getDoc(doc(db, 'deployments', 'frontend')).then(snap => {
  if (snap.exists()) {
    console.log(snap.data().commit || '');
  } else {
    console.log('');
  }
}).catch(() => console.log(''));
")

if [ "$LAST_COMMIT" = "$COMMIT_HASH" ]; then
    echo "Frontend already deployed at commit: $COMMIT_HASH"
    echo "Skipping deployment"
    exit 0
fi

if [ -n "$LAST_COMMIT" ]; then
    echo "Last deployed: $LAST_COMMIT"
    echo "New commit: $COMMIT_HASH"
else
    echo "No previous deployment found, will deploy..."
fi

echo "Building frontend..."
npm run build

echo "Deploying to Firebase..."
npx firebase deploy --only hosting --project et3am26 --token "$FIREBASE_TOKEN"

echo "Updating deployment record in Firestore..."
node -e "
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const config = {
  apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
  authDomain: 'et3am26.firebaseapp.com',
  projectId: 'et3am26',
  storageBucket: 'et3am26.firebasestorage.app',
  messagingSenderId: '119582207501',
  appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
};
const app = initializeApp(config);
const db = getFirestore(app);
setDoc(doc(db, 'deployments', 'frontend'), {
  commit: '$COMMIT_HASH',
  deployedAt: Date.now()
}, { merge: true }).then(() => console.log('Deployment record updated')).catch(e => console.error('Failed to update:', e));
"

echo "Frontend deployed successfully!"
