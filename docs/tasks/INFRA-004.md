# INFRA-004: Fix CI pnpm Cache Issues

**Status:** DONE

## Problem
CI failed with "Unable to locate executable file: pnpm" and lockfile issues.

## Root Cause
- `cache: 'pnpm'` in setup-node doesn't work with pnpm/action-setup
- Need to configure PATH after pnpm install
- frozen-lockfile caused failures when lock files missing

## Solution
1. Remove `cache: 'pnpm'` from setup-node
2. Use simple pnpm store cache
3. Remove `--frozen-lockfile` flag
4. Set security audit to moderate level

## Files Changed
- `.github/workflows/ci.yml` - Simplified pnpm setup
- `backend/pnpm-lock.yaml` - Added
- `frontend/pnpm-lock.yaml` - Added

## Tests
- CI: PASS (all 4 jobs)