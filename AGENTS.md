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

## Workflow

### 1. Before Any Work
- Fetch latest: `git fetch origin`
- Check current version: Look at `VERSION` file or `package.json` version

### 2. Make Changes
- Use conventional commits format
- Group related changes into logical commits

### 3. After Commit (Manual Trigger)
When ready to release:
1. Analyze commits since last release using: `git log --oneline --since="YYYY-MM-DD" | git commit-type-counter`
2. Determine new version based on commit types
3. Update version in:
   - `VERSION` file (create if not exists)
   - `package.json` (both root and frontend/backend if needed)
   - Any other version references
4. Create version commit: `feat(release): bump version to x.y.z`
5. Create annotated tag: `git tag -a vx.y.z -m "Release vx.y.z"`
6. Push with tags: `git push origin main --follow-tags`

### 4. Automated Deploy (Optional)
- On tag push, CI/CD can trigger build & deploy
- Use `npm run deploy` for frontend Firebase deployment

## Current Project Configuration

### Repository
- **Remote**: git@github.com:Amr1977/et3am.git
- **Branch**: main

### Frontend (Vite + Firebase)
- Location: `frontend/`
- Deploy command: `npm run deploy` (builds & deploys to Firebase hosting)
- Current project: foodshare777
- URL: https://foodshare777.web.app

### Backend
- Location: `backend/`
- Run command: Check `backend/package.json` scripts

## Version File Format
Create `VERSION` file in project root:
```
MAJOR=1
MINOR=0
PATCH=0
BUILD_DATE=2026-04-05
```

## Changelog Generation
Maintain `CHANGELOG.md` with sections:
- **Added** (feat)
- **Changed** (perf, refactor)
- **Fixed** (fix)
- **Removed** (breaking changes)
- **Security** (security fixes)

## Checklist for Release

- [ ] All commits follow conventional format
- [ ] Version bumped correctly based on commit analysis
- [ ] VERSION file updated
- [ ] package.json version updated (all packages)
- [ ] CHANGELOG.md updated with changes since last release
- [ ] Release commit created with message: `feat(release): release vx.y.z`
- [ ] Annotated tag created: `git tag -a vx.y.z -m "Release vx.y.z"`
- [ ] Pushed with tags: `git push origin main --follow-tags`
- [ ] Frontend deployed (if applicable): `npm run deploy` in frontend/

## Important Notes
- NEVER commit secrets, .env files, or credentials
- Always use `git pull --rebase` to avoid merge commits
- Keep commits atomic and focused
- Reference issues in commit footer when applicable: `Closes #123`