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

### 7. ESLint Flat Config Required for ESLint v10+

**Mistake:** Used `.eslintrc.json` with ESLint v10
```json
// ❌ WRONG - ESLint v10 requires flat config
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  ...
}
```

**Error:**
```
ESLint: 10.5.0
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```

**Impact:** Lint step fails, CI blocked

**Root Cause:** ESLint v9+ dropped `.eslintrc.*` (JSON/JS/YAML) format in favor of `eslint.config.js` (flat config)

**Correct Pattern:**
```js
// ✅ CORRECT - eslint.config.js (flat config)
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

module.exports = [
  {
    ignores: ["dist/", "node_modules/"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
```

**Lesson:** Always check ESLint version before creating config files. v10 requires `eslint.config.js` flat format.

**Note for ESM projects (type: "module" in package.json):** Use `import` syntax instead of `require()` in the config file.

---

### 8. pnpm Peer Dependency Conflicts in CI

**Mistake:** Added frontend dependencies without handling peer dep conflict
```
ERESOLVE could not resolve
peer @react-leaflet/core@"^3.0.0" from react-leaflet-cluster@4.1.3
```

**Impact:** `pnpm install` fails in CI, blocking the frontend build and lint jobs

**Root Cause:** `react-leaflet-cluster@4.1.3` requires `@react-leaflet/core@^3.0.0` but `react-leaflet@4.2.1` requires `@react-leaflet/core@^2.1.0`

**Solution:** Add `.npmrc` in the frontend directory:
```
# frontend/.npmrc
strict-peer-dependencies=false
```

**Lesson:** pnpm is strict about peer dependencies by default. For conflicting transient deps, use `.npmrc` to relax the check.

---

### 9. pnpm audit --audit-level Doesn't Support "none"

**Mistake:** Used `pnpm audit --audit-level=none`
```bash
# ❌ WRONG - "none" is not valid
pnpm audit --audit-level=none
```

**Impact:** CI security job failed

**Root Cause:** Unlike npm audit, pnpm's `--audit-level` only accepts: `info`, `low`, `moderate`, `high`, `critical`. Not `none`.

**Correct Patterns:**
```bash
# Use || true if you want non-breaking audit
pnpm audit || true

# Or set a specific level (still may fail above that)
pnpm audit --audit-level=critical
```

**Lesson:** Validate CLI flags in CI before pushing. pnpm and npm have different `audit` flag options.

---

### 10. Windows OOM on npm install with Large Dependency Trees

**Mistake:** Ran `npm install --save-dev` on frontend (large project)
```
FATAL ERROR: Zone Allocation failed - process out of memory
```

**Impact:** npm install crashes, can't install eslint locally

**Root Cause:** Windows has limited virtual memory (8GB RAM, ~1GB free). Firefox + opencode + node processes consume all memory.

**Solutions:**
1. Edit `package.json` manually to add dependencies, let CI install them
2. Use `NODE_OPTIONS=--max-old-space-size=4096` (helps sometimes)
3. Close Firefox and other memory-heavy apps
4. Use WSL or a different machine for local development

**Lesson:** On Windows with limited memory, manually edit `package.json` for dev deps rather than running `npm install --save-dev`.

---

### 11. Windows: node_modules/.bin/tsc is a Bash Script, Not JS

**Mistake:** Used `node ./node_modules/.bin/tsc -b` in package.json build script
```bash
# ❌ WRONG - fails on Windows
node --max-old-space-size=4096 ./node_modules/.bin/tsc -b
# Error: SyntaxError: missing ) after argument list
```

**Impact:** Frontend build fails on Windows (CI unaffected since it runs on Linux)

**Root Cause:** On Windows, `node_modules/.bin/tsc` is a **bash script** (not JS). Running it with `node` treats bash syntax as JS and fails. The `.bin/tsc.cmd` file is the Windows-compatible version, but npm scripts on Windows Git Bash resolve `tsc` (no ext) before `tsc.cmd`.

**Correct Patterns:**
```bash
# ✅ CORRECT - use typescript/bin/tsc.js directly (cross-platform)
node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc -b

# OR just use tsc directly (npm adds node_modules/.bin to PATH)
tsc -b
```

**Lesson:** Never run `.bin/*` shims with `node` directly on Windows. Use the compiler's real entry point at `node_modules/<package>/bin/<file>.js`, or rely on PATH resolution via npm scripts.

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