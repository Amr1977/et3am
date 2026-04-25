# Lessons Learned - ET3AM Project

**Accumulated:** 2026-04-25  
**Purpose:** Never repeat same mistakes twice

---

## Mistakes Documented

### 1. opencode.json - Invalid Configuration Keys

**Mistake:** Put `api_key`, `models` directly in opencode.json
```json
// ❌ WRONG - caused "Configuration is invalid: Unrecognized keys"
{
  "api_key": "sk-...",
  "models": ["gpt-4"]
}
```

**Impact:** Configuration invalid, tool broke twice

**Root Cause:** Using wrong field names for provider configuration

**Correct Pattern:**
```json
// ✅ CORRECT - use {env:VAR} pattern
{
  "provider": {
    "openai": {
      "options": {
        "baseURL": "{env:OPENAI_BASE_URL}",
        "apiKey": "{env:OPENAI_API_KEY}"
      }
    }
  },
  "model": "{env:MODEL}"
}
```

**Environment Variables:**
```bash
export OPENAI_BASE_URL="https://agentrouter.org/"
export OPENAI_API_KEY="sk-VChaz..."
export MODEL="claude-sonnet-4-20250514"
```

**Lesson:** Never put API keys directly in config files. Use {env:VAR} pattern.

---

### 2. KB Submodule vs Local Docs Confusion

**Mistake:** Tried to add files to `docs/kb` which is a git submodule
```bash
# ❌ WRONG - docs/kb is submodule
git add docs/kb/*.md
# Error: Pathspec is in submodule
```

**Impact:** Files not committed, confusion about where to add docs

**Root Cause:** `docs/kb` points to `shared-knowledge-base.git` as submodule

**Correct Approach:**
```bash
# Check if submodule
git status
# If shows "M docs/kb" - it's a submodule

# For project-specific docs (not shared):
# - Use docs/ (local, not submodule)

# For shared KB (to push to shared-knowledge-base):
cd docs/kb
git add ...
git commit
git push origin HEAD:master
```

**Lesson:** Check `git status` before adding docs - submodules show as `M docs/kb`

---

### 3. npm/pnpm Cache Conflicts in GitHub Actions CI

**Mistake:** Used both `cache: 'pnpm'` in setup-node AND `--frozen-lockfile`
```yaml
# ❌ WRONG
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'  # CONFLICTS with pnpm/action-setup

- name: Install dependencies
  run: pnpm install --frozen-lockfile  # FAILS if lockfile missing
```

**Impact:** Multiple CI failures - "Unable to locate executable file: pnpm", "pnpm-lock.yaml absent"

**Root Cause:** Two cache systems conflicting; --frozen-lockfile requires lockfile

**Correct CI Pattern:**
```yaml
# ✅ CORRECT - simple pnpm setup without conflicting cache
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Install pnpm
  uses: pnpm/action-setup@v4
  with:
    version: '9'

- name: Cache pnpm store
  uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: ${{ runner.os }}-pnpm-store

- name: Install dependencies
  run: pnpm install  # NOT --frozen-lockfile
```

**Lesson:** Don't combine cache:'pnpm' with pnpm/action-setup. Don't require frozen-lockfile unless lockfiles exist.

---

### 4. Firebase Deploy Invalid --dir Flag

**Mistake:** Used `--dir build` in firebase deploy
```bash
# ❌ WRONG
firebase deploy --only hosting --dir build
# Error: unknown option '--dir'
```

**Impact:** Deploy workflow failed

**Root Cause:** --dir flag not valid for hosting deployments

**Correct Pattern:**
```yaml
# ✅ CORRECT
- name: Deploy to Firebase Hosting
  run: firebase deploy --only hosting --project foodshare777
```

**Lesson:** Use `--project` flag, not `--dir`. Firebase auto-detects build output.

---

### 5. AgentRouter Wrong Base URL

**Mistake:** Used `https://api.agentrouter.ai/v1`
```bash
# ❌ WRONG
curl https://api.agentrouter.ai/v1/models
# Error: Could not resolve host
```

**Impact:** Cannot test/check available models

**Correct Base URL:**
```bash
# ✅ CORRECT
https://agentrouter.org/
```

**Environment:**
```bash
export OPENAI_BASE_URL="https://agentrouter.org/"
export OPENAI_API_KEY="your-key"
```

**Lesson:** Always verify base URL from official docs, not guess. AgentRouter blocks automated requests (WAF).

---

### 6. GitHub Token Pushed - Secret Exposure

**Mistake:** Committed GitHub PAT to git
```bash
# ❌ WRONG
git commit -m "docs: token"
# Error: GH013 - Push cannot contain secrets
```

**Impact:** Push blocked, had to reset commit

**Solution:**
```bash
git reset --hard <previous-commit>
git push --force
```

**Lesson:** Never commit tokens to git. Use environment variables or secrets.

---

## Checklist - Before Every Commit

- [ ] Check if config files are valid (opencode.json schema)
- [ ] Verify docs go to correct location (submodule vs local)
- [ ] Run tests before commit: `pnpm run test:run` + `pnpm run build`
- [ ] CI will catch issues, but test locally first
- [ ] Don't put secrets in config files - use {env:VAR}
- [ ] Verify base URLs are correct from official docs

---

## Related Documents

- `docs/kb/README.md` - KB index
- `docs/et3am/happy-path.md` - ET3AM happy path
- `docs/kb/tmux-setup.md` - Server setup
- `docs/kb/github-cli-install.md` - CLI installations