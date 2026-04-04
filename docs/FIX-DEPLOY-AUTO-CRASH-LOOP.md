# Fix: Deploy-Auto Crash Loop (2026-04-04)

## Issue
Backend servers (AWS and GCP) were in a crash loop.

## Root Cause
The `deploy-auto.sh` script was **still deploying frontend** even after code was updated to remove frontend deployment. The PM2 process had loaded the old script code in memory and wasn't reloading when git pulled the new version.

### Why This Happened
1. Fixed `deploy-auto.sh` locally to remove frontend deployment section
2. Committed and pushed changes to GitHub
3. `git pull` on server fetched the updated script
4. **BUT** PM2 process (`et3am-auto-deploy`) was still running the OLD in-memory script
5. On each CHECK_INTERVAL (60s), it would:
   - Detect "new changes" (from git fetch)
   - Try to build frontend with `npm run build`
   - Deploy to Firebase with `firebase deploy --only hosting`
   - Restart backend
   - Repeat infinitely

This caused:
- Constant frontend rebuilds (slow)
- Constant Firebase deployments (consuming quota)
- Rapid backend restarts
- Appearing as "crash loop"

## Solution
**Restarted the PM2 process** to force it to reload the fixed script from disk:

```bash
pm2 delete et3am-auto-deploy
pm2 start deploy-auto.sh --name et3am-auto-deploy
```

## What Was Fixed in deploy-auto.sh
Removed the entire frontend deployment section (lines 121-178):
- Removed frontend build logic
- Removed Firebase deploy calls
- Removed frontend deployment status tracking
- Script now only handles backend deployment

## Current Behavior (After Fix)
✅ Script only deploys backend on master push  
✅ No more frontend rebuilds/deployments  
✅ Frontend deployments must be manual (`npm run deploy`)  
✅ Backend process is stable

## Verification
```bash
# Check PM2 status
pm2 status | grep et3am-auto-deploy
# Should show: online, uptime > 0

# Check logs
pm2 logs et3am-auto-deploy --lines 20
# Should show: "No changes" when idle, NOT "Deploying to Firebase"
```

## Deployment Timeline
- **2026-04-04 20:27**: Last Firebase deploy via old script
- **2026-04-04 20:30**: Restarted PM2 process with fixed script
- **2026-04-04 20:31**: First check cycle with fixed script - "No changes"
- **Since 20:31**: Running stable, no crash loop

## Files Modified
- `deploy-auto.sh`: Removed frontend deployment logic (commit 5cd7d3b)

## Similar Issue in Matrix-Delivery
Matrix-delivery project has the same issue. Need to apply same fix there (deferred for later).

## Notes
- AWS server (api.et3am.com): ✅ Fixed and verified stable
- GCP server: Still needs verification but same fix applied
- Backend restart count after stable: 1740 total, 0 unstable
