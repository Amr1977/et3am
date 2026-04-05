#!/bin/bash

# Et3am Frontend Deployment Script
# Builds and deploys frontend to Firebase

set -e

echo "🚀 Building and deploying Et3am Frontend to Firebase..."

cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building frontend..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

echo "🔥 Deploying to Firebase (foodshare777)..."
firebase deploy --only hosting --project foodshare777

echo "🎉 Frontend deployment complete!"
echo "🌐 URL: https://foodshare777.web.app"