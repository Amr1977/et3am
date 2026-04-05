#!/bin/bash

# Et3am Frontend Deployment Script
# Builds and deploys frontend to Firebase

set -e

echo "🚀 Building and deploying Et3am Frontend to Firebase..."

cd frontend

echo "📦 Building frontend..."
npm run build

echo "🔥 Deploying to Firebase (foodshare777)..."
firebase deploy --only hosting --project foodshare777

echo "🎉 Frontend deployment complete!"
echo "🌐 URL: https://foodshare777.web.app"