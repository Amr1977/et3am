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

## CRITICAL - Task Lifecycle (MUST FOLLOW)

A task is ONLY complete when ALL steps are done:
1. ✅ Implemented
2. ✅ Backend tests pass (`npm run test:run`)
3. ✅ Frontend build succeeds (`npm run build`)
4. ✅ Deployed to both servers (FE + BE)
5. ✅ E2E tests pass (or manually verified)
6. ✅ Documented in `docs/tasks/{task_id}.md`

**Status Markers in TODO.md:**
| Marker | Meaning | Trello List |
|--------|---------|-------------|
| `[ ]` | Pending (not started) | TODO |
| `[P]` | In Progress | PROGRESS |
| `[x]` | Fully completed (deployed + tested) | DONE |

---

## Sync Workflow (When User Says "sync todo")

1. **Read TODO.md** - find `[P]` and `[x]` tasks
2. **Fetch Trello board** - get all cards and their lists
3. **Sync TODO.md → Trello:**
   - `[P]` tasks: move to PROGRESS list (create if not exists)
   - `[x]` tasks: move to DONE list
4. **Sync Trello → TODO.md:**
   - Cards in PROGRESS: add `[P]` to TODO.md
   - Cards in DONE: add `[x]` to TODO.md
   - New cards in TODO: create in Trello
5. **Update TASKLIST.md** with completed tasks
6. **Create task docs** for any new in-progress tasks
7. (Optional) Update KB - Document learnings, pitfalls, and patterns
8. (Optional) Push KB updates to remote submodule

---

## CRITICAL - Testing Before Every Commit
**ALWAYS run tests before committing:**
```bash
# Backend tests
cd backend && npm run test:run

# Frontend build (to catch errors)
cd frontend && npm run build
```
No exceptions - tests must pass before any commit.

## Session Start: Read KB First (Optional)
**At the START of a session, you MAY:**
1. Read `docs/kb/README.md` to understand available patterns
2. Read any recent additions in `docs/kb/deployment/`, `docs/kb/features/`, `docs/kb/bugs/`
3. Check `docs/kb/deployment/workflow-guide.md` for current workflow
4. Restore context from previous work - check `docs/tasks/` for any in-progress task docs

This is optional but helps avoid repeating work already documented.

---

## KB Update After Tasks (Optional)
**After completing NON-TRIVIAL tasks, you MAY:**
1. Document the technique/pattern used in appropriate KB folder
2. Document pitfalls encountered and how they were resolved
3. If reusable, add to KB (docs/kb/deployment/, docs/kb/features/, or docs/kb/bugs/)
4. Update KB submodule and push to remote

## Project Structure
```
et3am/
├── frontend/          # React + Vite + TypeScript
├── backend/           # Express + TypeScript + PostgreSQL
├── docs/              # Documentation
│   │   └── servers.md    # Server access info
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
- **Trello CLI (from backend dir):**
```bash
cd backend
npm run trello list                    # List all cards
npm run trello create "Title" TODO   # Create card
npm run trello move ET3AM-005 PROGRESS   # Move to list
npm run trello done ET3AM-005          # Move to DONE
npm run trello comment ET3AM-005 "Note" # Add comment
npm run trello sync                    # Sync TODO.md with Trello (dry run)
npm run trello sync --apply            # Sync with actual moves
```

---

---

## TODO.md & TASKLIST.md Workflow

### TODO.md Status Markers
- `[ ]` - Pending (not started)
- `[P]` - In Progress (actively working)
- `[x]` - Fully completed (deployed + tested)

### TASKLIST.md
- Maintains completed tasks history
- Format: Date, TASK_ID, Description
- Also tracks in-progress tasks

### Workflow:
1. User says "sync todo" (or adds task to TODO/Trello)
2. Agent syncs TODO.md ↔ Trello ↔ TASKLIST.md
3. For each task in progress, create `docs/tasks/{task_id}.md`
4. Track all actions in task doc
5. On completion: mark `[x]` in TODO.md + DONE in Trello + update TASKLIST.md
6. (Optional) Ask - Can this be generalized? If yes → Update KB

---

## Required Tools on VPS Servers

Install on any new server before starting work:

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y tmux gh
```

**Why:**
- **tmux**: Keeps processes running after SSH disconnect
- **gh**: Check CI/CD status, deployment results

See KB docs: `docs/kb/tmux-setup.md`, `docs/kb/github-cli-install.md`

---

## Knowledge Base (Optional)
- **Location:** `docs/kb/` (git submodule - optional for open source)
- **Required:** Document all infrastructure/setup tasks in KB
- **Apply:** Use documented patterns in all projects/sessions

See KB docs: `docs/kb/tmux-setup.md`, `docs/kb/github-cli-install.md`

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
7. (Optional) Update KB → Document learnings in docs/kb/, push to remote
8. **Update TASKLIST.md** → Mark complete
9. **Move Trello** → To DONE

---

## Task Documentation

### docs/tasks/{task_id}.md
For each task, create a documentation file containing:
- Task ID and Trello link
- Description and acceptance criteria
- Action log (all steps taken)
- Test results (before/after)
- Deployment status
- Notes and learnings

### Template
```markdown
# {task_id}: Task Title

**Trello:** [Link](url)
**Status:** IN PROGRESS | DONE

## Description

## Action Log
| Date | Action | Result |
|------|--------|--------|
| YYYY-MM-DD | Implemented feature | Pass |

## Tests
- Backend: PASS/FAIL
- Frontend Build: PASS/FAIL
- E2E: PASS/FAIL

## Deployment
- [ ] AWS
- [ ] GCP

## Learnings
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `TODO.md` | Pending tasks with markers `[ ]` `[P]` `[x]` |
| `TASKLIST.md` | Completed tasks history |
| `docs/tasks/{task_id}.md` | Per-task documentation |
| `VERSION` | Current version (MAJOR.MINOR.PATCH) |
| `docs/servers.md` | Server SSH credentials (remove before open source) |
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