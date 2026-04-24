# INFRA-005: Fix Frontend Deploy Workflow

**Status:** DONE

## Problem
Deploy workflow failed due to:
1. Missing package-lock.json (using pnpm now)
2. Invalid `--dir` flag for firebase CLI
3. Missing project flag

## Solution
1. Switched to pnpm for install/build
2. Removed `--dir` flag from firebase deploy
3. Added `--project foodshare777` flag

## Files Changed
- `.github/workflows/frontend-deploy.yml`

## CI Status
- All jobs PASS