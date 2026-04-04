# Disabled Automated Firebase Deployments

**Date:** 2026-04-04  
**Commit:** dd9237d  
**Status:** ✅ Completed

## Summary

All automated Firebase deployments have been disabled. Frontend deployments are now **manual-only** from the development machine, while backend remains **automatic**.

## Changes Made

### 1. deploy-auto.sh (Backend Auto-Deploy)
**Change:** Removed Firestore tracking logic
- **Before:** Script checked Firestore `deployments/backend` to decide if deploy needed
- **After:** Always deploys when `master` branch changes (git-based only)
- **Firestore Operations Removed:**
  - ❌ Reading `deployments/backend` document
  - ❌ Writing `deployments/backend` document
  - ❌ Firebase Admin initialization for tracking
- **Result:** Simpler logic, fewer dependencies, backend auto-deploys on any code change

### 2. deploy.sh (Manual Frontend Deploy)
**Change:** Removed Firestore deployment checks, marked as deprecated
- **Before:** Checked Firestore before deciding to deploy
- **After:** Always builds and deploys (no skip logic)
- **Firestore Operations Removed:**
  - ❌ Reading `deployments/frontend` document
  - ❌ Writing `deployments/frontend` document
  - ❌ Firebase Firestore SDK calls
- **Note:** Script is deprecated in favor of `npm run deploy` from frontend directory

### 3. deploy-frontend-checked.sh
**Change:** Marked as deprecated
- **Status:** ❌ Do not use
- **Reason:** All Firebase deployments should use `npm run deploy`
- **Kept For:** Historical reference only

### 4. Firestore Deployment Tracking
**Change:** Disabled entirely
- **Documents Removed:**
  - `deployments/frontend` - no longer used
  - `deployments/backend` - no longer used (was already cleared)
- **Reason:** Caused out-of-sync issues, not needed with manual frontend deployment
- **Alternative:** Git commit history provides deployment tracking

## Deployment Workflow After Changes

```
┌─────────────────────────────────────────────────────────┐
│                    Git Workflow                         │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│         Backend Auto-Deploy (Automatic)                 │
│  ────────────────────────────────────────────────────   │
│  Trigger: Git push to master                            │
│  Process: deploy-auto.sh (runs every 60s on servers)    │
│  Action:  npm install + tsc + pm2 restart               │
│  Target:  AWS (api.et3am.com) & GCP servers             │
│  Result:  ✓ Live within 60 seconds                      │
└─────────────────────────────────────────────────────────┘
            
┌─────────────────────────────────────────────────────────┐
│       Frontend Manual Deploy (Developer Only)           │
│  ────────────────────────────────────────────────────   │
│  Trigger: Developer runs 'npm run deploy'               │
│  Process: npm run build && firebase deploy              │
│  Action:  Build + Vite bundle + Firebase Hosting        │
│  Target:  Firebase Hosting (et3am26.web.app)            │
│  Result:  ✓ Live within 5-10 minutes                    │
└─────────────────────────────────────────────────────────┘
```

## Frontend Deployment Guide

### Standard Procedure

```bash
# From project root
cd frontend
npm run deploy
```

### What Happens
1. ✅ Git info generated (`git-info.json`)
2. ✅ TypeScript compiled
3. ✅ Vite builds production bundle
4. ✅ Firebase CLI deploys to hosting
5. ✅ Site live at https://et3am26.web.app

### Rollback
```bash
git revert <bad-commit>
git push origin master
cd frontend
npm run deploy
```

## Backend Deployment Guide

### Standard Procedure
```bash
git push origin master
# Wait ~60 seconds, backend auto-deploys
```

### Verify Deployment
```bash
ssh <server> "pm2 logs et3am-auto-deploy --lines 20"
```

### Rollback
```bash
git revert <bad-commit>
git push origin master
# Wait ~60 seconds, backend auto-updates
```

## Why These Changes?

### Problems We Solved
1. **Firestore Out-of-Sync:** Firestore records got stale, causing old code to redeploy
2. **Multiple Scripts:** Too many ways to deploy, confusion about which to use
3. **Auto-Everything:** Unintended automatic deployments of incomplete/untested code

### Benefits
1. **Manual Frontend = Controlled Releases** - Only deploy when ready
2. **Automatic Backend = Fast Iteration** - Push and it's live (for backend devs)
3. **No Firestore Drift** - No tracking overhead, git history is the source of truth
4. **Simpler Scripts** - Remove complex Firebase SDK integration from deployment
5. **Fail-Safe** - Even if backend deploys accidentally, frontend won't change unexpectedly

## Backward Compatibility

**BREAKING CHANGE:** `deploy.sh` and `deploy-frontend-checked.sh` are deprecated

**Migration Required:**
- ❌ Stop using: `./deploy.sh`
- ❌ Stop using: `./deploy-frontend-checked.sh`
- ✅ Use instead: `cd frontend && npm run deploy`

## Verification

To verify the changes are working:

```bash
# Check deploy-auto.sh has no Firestore calls
grep -i "firestore\|firebase/app\|setDoc\|getDoc" deploy-auto.sh
# Should return: No results (empty)

# Check deploy.sh is marked deprecated
head -5 deploy.sh
# Should show: [DEPRECATED] warning

# Check frontend npm deploy works
cd frontend
npm run deploy
# Should build and deploy successfully
```

## Migration Checklist

- [x] Remove Firestore calls from deploy-auto.sh
- [x] Remove Firestore checks from deploy.sh
- [x] Mark old scripts as deprecated
- [x] Document deployment policy
- [x] Push changes to master
- [x] Backend servers will auto-pull and continue working
- [ ] Team notified of new deployment procedure
- [ ] Update CI/CD documentation (if applicable)

## Related Documentation

- `DEPLOYMENT-POLICY.md` - Full deployment policy and procedures
- `DEPLOYMENT-ARCHITECTURE.md` - System design overview
- `FIX-FIRESTORE-DEPLOYMENT-TRACKING.md` - Historical context

## Questions?

See `docs/DEPLOYMENT-POLICY.md` for complete procedures, troubleshooting, and FAQs.
