# INFRA-001: CI Workflow - Switch from npm to pnpm

**Status:** DONE

## Description
Fix CI workflow failures caused by npm peer dependency conflicts and missing package-lock.json files. Migrated from npm to pnpm for better peer dependency handling.

## Problem
1. `frontend/package-lock.json` didn't exist
2. `npm ci` failed without lock file
3. React-leaflet-cluster required react@19 but project uses react@18
4. `--legacy-peer-deps` was a workaround but caused cache resolution errors

## Solution
Switched entire CI workflow from npm to pnpm:
1. Added pnpm/action-setup@v4
2. Added pnpm caching with actions/cache@v4
3. Changed all install commands to `pnpm install --frozen-lockfile`

## Commits
| Commit | Description |
|--------|-------------|
| 44f42ad | fix: remove npm caching from CI workflow |
| 8d03acc | fix: use npm install for frontend in CI |
| c8897cd | fix: add legacy-peer-deps for frontend install |
| bcd02c9 | fix: replace npm ci with npm install in lint and security jobs |
| 7c51829 | fix: switch from npm to pnpm in CI workflow |

## Files Changed
- `.github/workflows/ci.yml` - Complete rewrite to use pnpm

## Tests
- Backend: PASS
- Frontend Build: PASS
- CI: PASS

## Learnings
- pnpm handles peer dependencies better than npm
- pnpm's strict mode (`--frozen-lockfile`) ensures reproducible builds
- pnpm caching via pnpm/action-setup is reliable for GitHub Actions