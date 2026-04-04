# Deployment Policy

**Effective Date:** 2026-04-04  
**Status:** Active

## Overview

All Et3am deployments follow a **manual-only** strategy for the frontend and **automatic-only** for the backend. This prevents accidental deployments of untested code and ensures controlled rollouts.

## Deployment Strategy

### Frontend: Manual Only 🚀
- **When:** Only when explicitly running deployment command
- **How:** From your machine using `npm run deploy`
- **Where:** Firebase Hosting (et3am26.web.app)
- **Who:** Any developer with Firebase CLI access

### Backend: Automatic Only 🔄
- **When:** Automatically when code is pushed to `master` branch
- **How:** Via `deploy-auto.sh` on production servers
- **Where:** AWS and GCP servers (api.et3am.com)
- **Who:** Automated via PM2 process monitoring

## Frontend Deployment

### Standard Procedure

```bash
# From project root
cd frontend
npm run deploy
```

This command:
1. ✅ Generates git info (`git-info.json`)
2. ✅ Compiles TypeScript
3. ✅ Builds with Vite
4. ✅ Deploys to Firebase Hosting

**Deployment takes ~5-10 minutes**

### What Gets Deployed

- React app compiled bundle
- All static assets (images, fonts, CSS)
- Service workers and PWA manifest
- Open Graph images

### What Does NOT Get Deployed

- `.env` files (never)
- Build artifacts or node_modules
- Test files or configuration
- Backend code or credentials

### Manual Verification

1. Check build output for errors
2. Wait for Firebase deploy completion message
3. Visit https://et3am26.web.app
4. Test the feature you deployed

## Backend Deployment

### Automatic Process

The `deploy-auto.sh` script:
1. Runs every 60 seconds on production servers
2. Checks for new commits on `master` branch
3. Auto-deploys if code changed
4. Restarts backend service via PM2

**No manual action required** - just push to master!

### Deployment Locations

- **AWS:** api.et3am.com (ubuntu@api.et3am.com)
- **GCP:** matrix-delivery-api-gc.mywire.org (amr_lotfy_othman@...)

### What Gets Deployed

- Compiled TypeScript in `backend/dist/`
- Node modules (with production deps only)
- Environment configuration from `.env.production`

### What Does NOT Get Deployed

- Frontend code
- Firebase hosting files
- Test files
- Development dependencies

## Disabled Automation

The following automated processes are **DISABLED** to prevent unintended Firebase deployments:

### Disabled Scripts

- ❌ `deploy.sh` - Marked as deprecated, no auto-trigger
- ❌ `deploy-frontend-checked.sh` - Marked as deprecated
- ❌ GitHub Actions workflows - None configured
- ❌ CI/CD Firebase deployment - Removed

### Disabled Firestore Tracking

The automated Firestore deployment tracking (`deployments/frontend` document) is **no longer used**. Deployment decisions are based on git commits only.

## Rollback Procedure

### Frontend Rollback

If you deployed code that breaks the app:

```bash
# 1. Revert the commit locally
git revert <commit-hash>

# 2. Push to master
git push origin master

# 3. Deploy the revert
cd frontend
npm run deploy

# 4. Verify at https://et3am26.web.app
```

### Backend Rollback

```bash
# 1. Revert the commit
git revert <commit-hash>

# 2. Push to master
git push origin master

# 3. Wait ~60 seconds for auto-deploy to pick it up
# Monitor via: ssh <server> "pm2 logs et3am-auto-deploy"
```

## Deployment Checklist

Before deploying frontend:

- [ ] Code changes are tested locally
- [ ] No console errors or warnings
- [ ] Mobile responsive design verified
- [ ] All authentication flows work
- [ ] Environment variables are correct
- [ ] Dependencies are installed (`npm install`)
- [ ] Build succeeds (`npm run build`)

## Emergency Procedures

### If Firebase Gets Old Code

1. Check what commit is currently deployed:
   ```bash
   git log --oneline -5
   ```

2. Verify that's what you see in the app

3. Deploy latest code:
   ```bash
   cd frontend
   npm run deploy
   ```

### If Backend Won't Update

1. Check auto-deploy logs:
   ```bash
   ssh <server> "pm2 logs et3am-auto-deploy --lines 100"
   ```

2. Check backend logs:
   ```bash
   ssh <server> "pm2 logs et3am-backend --lines 100"
   ```

3. Manually trigger:
   ```bash
   ssh <server> "cd /path/to/et3am && git pull origin master && pm2 restart et3am-backend"
   ```

## Security Notes

- Firebase token should be stored safely (GitHub Secrets if using CI)
- `.env` files are never deployed
- Database credentials are server-only
- Admin credentials are never in version control

## Related Documentation

- `DEPLOYMENT-ARCHITECTURE.md` - System design and flow
- `FIX-DEPLOY-AUTO-CRASH-LOOP.md` - Historical context on auto-deploy
- `FIX-FIRESTORE-DEPLOYMENT-TRACKING.md` - Why Firestore tracking was disabled
- `FIX-GOOGLE-AUTH-INVALID-REQUEST.md` - Example frontend deployment

## Questions?

Check the deployment logs or the `docs/` folder for more information.

---

**Last Updated:** 2026-04-04  
**Maintained By:** Development Team
