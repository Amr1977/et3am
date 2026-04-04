#!/bin/bash

# [DEPRECATED] Use npm run deploy from frontend/ directory instead
# This script is kept for reference only - all deployments must be manual

# Et3am Deployment Script
# Deploys frontend to Firebase Hosting and backend to production server

set -e

echo "=========================================="
echo "  Et3am Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
SERVER_HOST="ubuntu@api.et3am.com"
SERVER_BACKEND_DIR="/home/ubuntu/et3am/backend"
ENV_FILE="$BACKEND_DIR/.env.production"

# Check if .env.production exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE not found!${NC}"
    exit 1
fi

# Parse .env file
while IFS='=' read -r key value; do
    case "$key" in
        SERVER_URL) SERVER_URL="$value" ;;
    esac
done < "$ENV_FILE"

echo -e "${YELLOW}Server URL: $SERVER_URL${NC}"

# Function to deploy frontend
deploy_frontend() {
    echo -e "\n${YELLOW}=== Deploying Frontend to Firebase ===${NC}"
    
    cd "$FRONTEND_DIR"
    
    COMMIT_HASH=$(git rev-parse HEAD)
    echo "Current commit: $COMMIT_HASH"
    
    echo "Building frontend..."
    npm run build
    
    echo "Deploying to Firebase Hosting..."
    npx firebase deploy --only hosting --project et3am26
    
    echo -e "${GREEN}Frontend deployed successfully!${NC}"
    echo "Frontend URL: https://et3am26.web.app"
    cd ..
}

# Function to deploy backend
deploy_backend() {
    echo -e "\n${YELLOW}=== Deploying Backend to Server ===${NC}"
    
    COMMIT_HASH=$(git rev-parse HEAD)
    echo "Current commit: $COMMIT_HASH"
    
    echo "Checking if backend already deployed..."
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
        getDoc(doc(db, 'deployments', 'backend')).then(snap => {
          if (snap.exists()) console.log(snap.data().commit || '');
          else console.log('');
        }).catch(() => console.log(''));
    " 2>/dev/null || echo "")
    
    if [ "$LAST_COMMIT" = "$COMMIT_HASH" ]; then
        echo -e "${GREEN}Backend already deployed at commit: $COMMIT_HASH${NC}"
        echo "Triggering reload on server..."
        ssh "$SERVER_HOST" "cd /home/ubuntu/et3am && git pull origin master && pm2 restart et3am-backend"
        echo -e "${GREEN}Backend reloaded successfully!${NC}"
        return 0
    fi
    
    echo "Triggering git pull and restart on server..."
    ssh "$SERVER_HOST" << 'EOF'
        cd /home/ubuntu/et3am
        git fetch origin master
        git reset --hard origin/master
        cd backend
        npm install --omit=dev
        pm2 restart et3am-backend || pm2 start ecosystem.config.js
EOF
    
    echo "Updating deployment record..."
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
        setDoc(doc(db, 'deployments', 'backend'), { commit: '$COMMIT_HASH', deployedAt: Date.now() }, { merge: true }).catch(() => {});
    "
    
    echo -e "${GREEN}Backend deployed successfully!${NC}"
    echo "Backend URL: $SERVER_URL"
}

# Parse command line arguments
DEPLOY_FRONTEND=true
DEPLOY_BACKEND=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend-only)
            DEPLOY_BACKEND=false
            shift
            ;;
        --backend-only)
            DEPLOY_FRONTEND=false
            shift
            ;;
        --help)
            echo "Usage: ./deploy.sh [options]"
            echo ""
            echo "Options:"
            echo "  --frontend-only    Deploy only frontend"
            echo "  --backend-only     Deploy only backend"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Deploy
if [ "$DEPLOY_FRONTEND" = true ]; then
    deploy_frontend
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    deploy_backend
fi

echo -e "\n${GREEN}=========================================="
echo "  Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Frontend: https://et3am26.web.app"
echo "Backend:  $SERVER_URL"