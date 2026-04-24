# INFRA-005: Fix Frontend Deploy Workflow

**Status:** DONE

## Problem
Deploy workflow failed due to:
1. Missing package-lock.json (using pnpm now)
2. Invalid `--dir` flag for firebase CLI

## Solution
1. Switched to pnpm for install/build
2. Removed `--dir` flag from firebase deploy

## Files Changed
- `.github/workflows/frontend-deploy.yml`

## CI Status
- All 4 jobs PASS (backend-test, frontend-build, lint, security)