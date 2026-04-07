# Version Control & Release Management Plan

## Overview
This project uses **Conventional Commits** with **Auto-Versioning** based on git commits. Every commit triggers version updates following semantic versioning rules.

## Version Bumping Rules

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `feat` | Minor (x.**y**.z) | 1.0.0 → 1.1.0 |
| `fix` | Patch (x.y.**z**) | 1.0.0 → 1.0.1 |
| `docs` | Patch | 1.0.0 → 1.0.1 |
| `style` | Patch | 1.0.0 → 1.0.1 |
| `refactor` | Patch | 1.0.0 → 1.0.1 |
| `perf` | Minor | 1.0.0 → 1.1.0 |
| `test` | Patch | 1.0.0 → 1.0.1 |
| `build` | Patch | 1.0.0 → 1.0.1 |
| `ci` | Patch | 1.0.0 → 1.0.1 |
| `chore` | None | No version change |
| `revert` | Patch | 1.0.0 → 1.0.1 |

**Breaking Change**: Any commit with `!` after type or `BREAKING CHANGE:` in footer bumps **Major** version (x.0.0).

---

# Agent Workflow Guide

## CRITICAL - Testing Before Every Commit
**ALWAYS run tests before committing:**
```bash
# Backend tests
cd backend && npm run test:run

# Frontend build (to catch errors)
cd frontend && npm run build
```
No exceptions - tests must pass before any commit.

## Project Structure
```
et3am/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express + TypeScript + PostgreSQL
├── docs/              # Documentation
│   ├── kb/           # Knowledge Base (git submodule)
│   └── servers.md    # Server access info
├── TODO.md           # Tasks to process
├── TASKLIST.md       # Completed tasks
├── VERSION           # Version file
└── AGENTS.md        # This workflow guide
```

---

## Access Information

### GitHub Repository
- **Remote:** git@github.com:Amr1977/et3am.git
- **Branch:** master

### Server Access (see docs/servers.md for full details)

**AWS Server (api.et3am.com):**
```bash
ssh ubuntu@api.et3am.com
# Project: /home/ubuntu/et3am
# PM2: et3am-backend
```

**GCP Server (matrix-delivery-api-gc.mywire.org):**
```bash
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org
# Project: /home/amr_lotfy_othman/et3am
# PM2: et3am-backend
```

### Check Backend Logs
```bash
# AWS
ssh ubuntu@api.et3am.com "tail -50 /home/ubuntu/et3am/backend/logs/combined.log"

# GCP
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "tail -50 /home/amr_lotfy_othman/et3am/backend/logs/combined.log"
```

### Restart Backend
```bash
ssh ubuntu@api.et3am.com "pm2 restart et3am-backend"
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "pm2 restart et3am-backend"
```

---

## Trello Board
- **URL:** https://trello.com/b/et3am-project
- **Workflow:** BACKLOG → TODO → PROGRESS → DONE
- **Labels:** Feature, Bug, High Priority, etc.
- **TASK_ID format:** ET3AM-XXX (features), BUG-XXX (bugs)

---

## Knowledge Base
- **Location:** `docs/kb/` (git submodule)
- **Update after any non-trivial task**

---

## Common Commands

### Development
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev
```

### Testing
```bash
# Backend unit tests
cd backend && npm run test:run

# Frontend E2E tests
cd frontend && npx playwright test

# Run specific test
cd frontend && npx playwright test tests/e2e/donation-flow-complete.e2e.ts --project=chromium
```

### Building & Deploying
```bash
# Frontend
cd frontend && npm run build && npm run deploy

# Backend - Manual (if build fails on server)
# 1. Build locally first
cd backend && npm run build
# 2. Deploy to both servers
./deploy-backend.sh
```

---

## Workflow Summary

1. **Read TODO.md** → Pick next task
2. **Check Trello** → Create/move ticket to PROGRESS
3. **Implement fix** → Write tests first!
4. **Run tests** → Fix any failures
5. **Commit** → Update VERSION file
6. **Deploy** → Both FE and BE
7. **Update KB** → Document learnings in docs/kb/
8. **Update TASKLIST.md** → Mark complete
9. **Move Trello** → To DONE

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `TODO.md` | Pending tasks (READ ONLY - don't modify) |
| `TASKLIST.md` | Completed tasks history |
| `VERSION` | Current version (MAJOR.MINOR.PATCH) |
| `docs/servers.md` | Server SSH credentials |
| `docs/kb/` | Knowledge Base submodule |
| `frontend/tests/e2e/` | E2E tests |

---

## Important Notes
- NEVER commit secrets, .env files, or credentials
- Always use `git pull --rebase` to avoid merge commits
- Keep commits atomic and focused
- Reference issues in commit footer: `Closes #123`
- ALWAYS run tests before commit - NO EXCEPTIONS

---

## Current Project Configuration

### Repository
- **Remote**: git@github.com:Amr1977/et3am.git
- **Branch**: master

### Frontend (Vite + Firebase)
- Location: `frontend/`
- Deploy: `npm run deploy` → Firebase hosting
- Firebase project: **foodshare777**
- URL: https://foodshare777.web.app

### Backend
- Location: `backend/`
- Run: `npm run dev` (dev) or `pm2 restart et3am-backend` (production)
- Deployed on AWS and GCP

---

## Version File Format
```
MAJOR=1
MINOR=5
PATCH=5
BUILD_DATE=2026-04-07
LAST_RELEASE_COMMIT=4a9a993
```

---

## Current Version: 1.5.5