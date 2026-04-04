# Fix: Firestore Deployment Tracking Out of Sync

**Date:** 2026-04-04  
**Status:** Fixed  
**Issue:** Firebase Hosting was serving old frontend code due to mismatched deployment records

## Problem

The deployment tracking system uses Firestore to store which commit hash is deployed:

```
/deployments/frontend -> { commit: "...", deployedAt: ... }
/deployments/backend  -> { commit: "...", deployedAt: ... }
```

When deployment scripts (`deploy.sh`, `deploy-frontend-checked.sh`, or `deploy-auto.sh`) need to decide whether to redeploy, they:
1. Read the Firestore deployment record for the last deployed commit
2. Compare it to the current `HEAD` commit
3. If they match, skip deployment
4. If they differ, rebuild and redeploy

**The Issue:** The Firestore record was outdated:
- **Stored in Firestore:** commit `220f47f` (old meal lifecycle feature from months ago)
- **Actually deployed:** commit `b26e247` (current code with Google Auth fix)
- **In Git HEAD:** commit `b26e247`

This mismatch caused any deployment script to think old code needed to be redeployed, overwriting the current Firebase Hosting with ancient code.

## Root Cause

The Firestore deployment tracking got out of sync because:
1. Manual deployments may have been done without updating Firestore records
2. Frontend was deployed manually multiple times without syncing Firestore
3. No atomic transaction between code deployment and record update

## Solution

Reset the Firestore deployment records to match the current deployed code:

```javascript
// Get current HEAD commit
CURRENT_COMMIT=$(git rev-parse HEAD)  // b26e2474d84a5e861f9c874b1c2b0aca097f27bb

// Update Firestore record
setDoc(doc(db, 'deployments', 'frontend'), { 
  commit: CURRENT_COMMIT, 
  deployedAt: Date.now() 
}, { merge: true })
```

## Changes Made

1. **Verified current deployment:** Confirmed Firebase Hosting has code from commit `b26e247` (with Google Auth fix)
2. **Updated Firestore:** Changed `deployments/frontend` record from `220f47f` to `b26e247`
3. **Verified update:** Confirmed Firestore now matches deployed code

## Impact

After this fix:
- Deployment scripts will correctly detect that frontend is up-to-date
- No automatic redeploys of old code will occur
- Future deployments will only happen on actual code changes

## Prevention

To prevent this in the future:

### 1. Always update Firestore when deploying manually
```bash
# After manual deploy
node -e "
  const { initializeApp } = require('firebase/app');
  const { getFirestore, doc, setDoc } = require('firebase/firestore');
  // ... config ...
  const commit = require('child_process').execSync('git rev-parse HEAD').toString().trim();
  setDoc(doc(db, 'deployments', 'frontend'), { 
    commit, 
    deployedAt: Date.now() 
  }, { merge: true });
"
```

### 2. Use atomic operations
Modify deployment scripts to fail completely if Firestore update fails, ensuring record stays in sync.

### 3. Add monitoring
Log deployment records to help detect sync issues:
```bash
# Check deployment status regularly
node scripts/check-deployment-status.js
```

### 4. Use GitHub Actions or CI/CD
Automate frontend deployments through CI/CD to ensure Firestore is always updated atomically.

## Verification

**Before fix:**
```
Firestore frontend:  220f47f (outdated)
Git HEAD:            b26e247 (current)
→ Mismatch → Old code gets redeployed
```

**After fix:**
```
Firestore frontend:  b26e247 (current)
Git HEAD:            b26e247 (current)
→ Match → No redeploy, current code remains
```

## Related Files

- `deploy.sh` - Manual deployment script (has Firestore sync logic)
- `deploy-frontend-checked.sh` - CI/CD frontend deployment
- `deploy-auto.sh` - Automatic backend deployment (also syncs Firestore)
- Frontend Firebase config: `frontend/src/firebase.ts`

## Next Steps

1. Monitor that no old code is being redeployed
2. Consider adding GitHub Actions workflow for atomic frontend deployment
3. Add deployment status monitoring dashboard
4. Document deployment procedures for the team
