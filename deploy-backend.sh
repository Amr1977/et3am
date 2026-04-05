#!/bin/bash

# Et3am Backend Deployment Script
# Deploys backend to both AWS and GCP servers

set -e

echo "🚀 Deploying Et3am Backend to production servers..."

# Auto-bump version before deploy
echo "📝 Bumping version..."
source ./version-bump.sh
git add VERSION
git commit -m "release: bump version to $NEW_MAJOR.$NEW_MINOR.$NEW_PATCH" || true

# Server 1: AWS (api.et3am.com)
echo "📦 Deploying to AWS (api.et3am.com)..."
ssh ubuntu@api.et3am.com "cd /home/ubuntu/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install && npm run build && pm2 restart et3am-backend"

echo "✅ AWS deployment complete"

# Server 2: GCP (matrix-delivery-api-gc.mywire.org)
echo "📦 Deploying to GCP (matrix-delivery-api-gc.mywire.org)..."
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "cd /home/amr_lotfy_othman/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install && npm run build && pm2 restart et3am-backend"

echo "✅ GCP deployment complete"

echo "🎉 Backend deployment to both servers complete!"