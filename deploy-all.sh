#!/bin/bash

# Et3am Full Deployment Script
# Deploys both backend and frontend after push to master

set -e

echo "🚀 Starting full deployment (Backend + Frontend)..."

# Auto-bump version once at the start
echo "📝 Bumping version..."
source ./version-bump.sh

# Deploy Backend to both servers
echo ""
echo "=========================================="
echo "  Deploying Backend"
echo "=========================================="

# AWS
echo "📦 Deploying to AWS (api.et3am.com)..."
ssh ubuntu@api.et3am.com "cd /home/ubuntu/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install && npm run build"

echo "🔄 Restarting AWS backend with environment..."
ssh ubuntu@api.et3am.com "cd /home/ubuntu/et3am/backend && pm2 stop et3am-backend 2>/dev/null || true && pm2 delete et3am-backend 2>/dev/null || true && export \$(cat .env.production | grep -v '^#' | xargs) && pm2 start dist/server.js --name et3am-backend && pm2 save"
echo "✅ AWS backend deployed"

# GCP  
echo "📦 Deploying to GCP (matrix-delivery-api-gc.mywire.org)..."
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "cd /home/amr_lotfy_othman/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install && npm run build"

echo "🔄 Restarting GCP backend with environment..."
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "cd /home/amr_lotfy_othman/et3am/backend && pm2 stop et3am-backend 2>/dev/null || true && pm2 delete et3am-backend 2>/dev/null || true && export \$(cat .env.production | grep -v '^#' | xargs) && pm2 start dist/server.js --name et3am-backend && pm2 save"
echo "✅ GCP backend deployed"

# Deploy Frontend to Firebase
echo ""
echo "=========================================="
echo "  Deploying Frontend"
echo "=========================================="

cd frontend

echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

echo "🏗️ Building frontend..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

echo "🔥 Deploying to Firebase (foodshare777)..."
firebase deploy --only hosting --project foodshare777

echo "✅ Frontend deployed to https://foodshare777.web.app"

echo ""
echo "🎉 Full deployment complete!"
