# Et3am Public Repository - Open Source Plan

**Version:** 1.0  
**Date:** 2026-04-07  
**Status:** Ready for Implementation

---

## Executive Summary

This document outlines the complete plan to make the Et3am repository publicly available for community contributions while maintaining security and operational stability.

### Selected Approach
- **Contribution Model:** Open PR Model (Anyone can fork, submit PRs, maintainers review)
- **API Access:** Separate Community API with rate limiting
- **Admin Functions:** Keep Private (not in public repo)

---

## Phase 1: Security Hardening

**Priority: CRITICAL - Must complete before making public**

### 1.1 Environment & Secrets

| Task | Effort | Status |
|------|--------|--------|
| Verify `.env` files NOT in git | 1 hr | ⬜ |
| Create `.env.public.example` with safe defaults | 1 hr | ⬜ |
| Rotate all production API keys/secrets | 1 hr | ⬜ |
| Remove hardcoded credentials in code | 2 hr | ⬜ |

**Files to verify in `.gitignore`:**
```gitignore
# Environment files
backend/.env
backend/.env.*
frontend/.env
frontend/.env.*

# Logs
backend/src/logs/
*.log

# OS
.DS_Store
```

### 1.2 API Security - Community Tier

**Create new endpoints:** `/api/public/*`

```
GET  /api/public/donations     - List available (no auth required)
GET  /api/public/stats         - Public stats only
POST /api/public/auth/register - Registration (rate limited)
POST /api/public/auth/login    - Login (rate limited)
GET  /api/public/donations/:id - View donation (masked location)
```

**Rate Limits:**
- 100 requests/minute per IP
- 100 requests/day for auth endpoints
- Require `X-API-Key` header for production-like access

### 1.3 Dependency Security

| Task | Effort | Status |
|------|--------|--------|
| Run `npm audit` on both projects | 1 hr | ⬜ |
| Fix all critical/high vulnerabilities | 4 hr | ⬜ |
| Add Dependabot configuration | 1 hr | ⬜ |
| Add npm audit to CI | 1 hr | ⬜ |

### 1.4 Code Sanitization

| Task | Effort | Status |
|------|--------|--------|
| Remove console.log with sensitive data | 2 hr | ⬜ |
| Add CSRF protection middleware | 2 hr | ⬜ |
| Add request size limits | 1 hr | ⬜ |

---

## Phase 2: Repository Configuration

### 2.1 GitHub Settings

| Setting | Action |
|---------|--------|
| Branch Protection | Require PR review + status checks |
| Allow Force Push | **DISABLED** |
| Auto-delete Head Branches | Enable |
| Require Conversation Resolution | Enable |

### 2.2 Repository Files to Create/Update

| File | Status |
|------|--------|
| `README.md` | Update - add contributor section |
| `CONTRIBUTING.md` | Create |
| `CODE_OF_CONDUCT.md` | Create |
| `LICENSE` | Create (MIT) |
| `SECURITY.md` | Update - verify content |
| `.github/ISSUE_TEMPLATE/` | Create templates |

---

## Phase 3: Community Database

### 3.1 New Neon Database

**Create new Neon project:** `et3am-community`

**Connection string format:**
```
postgresql://user:password@host.neon.tech/et3am?sslmode=require
```

**Schema:** Same as production, but with:
- Public-only data
- Can reset anytime
- Separate from production

### 3.2 Environment Files Structure

```
backend/
├── .env                    # Local dev (NOT in git)
├── .env.example            # Template for contributors
├── .env.production         # Your production (NOT in git)
└── .env.community          # Community DB (NOT in git)
```

---

## Phase 4: Documentation

### 4.1 CONTRIBUTING.md Content

```markdown
# Contributing to Et3am

## Quick Start
1. Fork the repository
2. Clone your fork locally
3. Install dependencies
4. Run development servers

## Development Setup
- Node.js 20+
- PostgreSQL (use provided docker-compose or Neon)
- Firebase project (create your own)

## Pull Request Process
1. Create feature branch from `master`
2. Make your changes
3. Add/update tests
4. Ensure linting passes
5. Submit PR with description
6. Wait for review (may take 1-2 days)

## Coding Standards
- Use ESLint + Prettier
- Follow Conventional Commits
- Add tests for new features
- Update documentation

## Development API
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Use .env.example as template
```

### 4.2 Architecture Overview (Public Version)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Community  │────▶│  Community  │
│   (React)   │     │     API     │     │  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Firebase  │     │  Firestore  │
│  (Auth +)   │     │  (Registry) │
└─────────────┘     └─────────────┘
```

**Note:** Admin panel and production API NOT included in public repo.

---

## Phase 5: CI/CD Pipeline

### 5.1 GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [master]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install and Test
        run: |
          cd backend
          npm install
          npm run test:run

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install and Build
        run: |
          cd frontend
          npm install
          npm run build
```

### 5.2 Required Status Checks

| Check | Description |
|-------|-------------|
| `backend-test` | All backend tests pass |
| `frontend-build` | Frontend compiles without errors |
| `lint` | ESLint passes |

---

## Phase 6: Implementation Timeline

| Step | Task | Effort |
|------|------|--------|
| 1 | Rotate all secrets | 1 day |
| 2 | Update .gitignore | 2 hr |
| 3 | Create community API endpoints | 3 days |
| 4 | Add rate limiting | 1 day |
| 5 | Create CONTRIBUTING.md | 2 hr |
| 6 | Create CODE_OF_CONDUCT.md | 1 hr |
| 7 | Create LICENSE (MIT) | 1 hr |
| 8 | Configure GitHub branch protection | 1 hr |
| 9 | Set up Dependabot | 1 hr |
| 10 | Add GitHub Actions CI | 2 hr |
| 11 | Clean console.log statements | 2 hr |
| 12 | Create community Neon database | 1 hr |
| 13 | Test locally with new config | 1 hr |
| 14 | Make repo public | 30 min |

**Total: ~10-12 days**

---

## Risk Mitigation

| Risk | Mitigation |
|------|-------------|
| Secrets exposed in history | Rewrite git history or create fresh repo |
| DDoS attacks | CloudFlare + rate limiting on API |
| Bad/malicious PRs | Require 2 reviewers, manual merge |
| Data leakage | Separate community database |
| Spam/abuse | API key required for extended access |
| Vulnerable dependencies | Dependabot + npm audit in CI |

---

## License

**MIT License** - Simple, permissive, appropriate for open source charitable projects.

---

## Next Steps

1. Approve this plan
2. Start Phase 1: Security Hardening
3. Create community Neon database
4. Test locally
5. Make repository public
6. Announce to community

---

*Document Version: 1.0 | Last Updated: 2026-04-07*