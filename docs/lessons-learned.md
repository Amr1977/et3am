# KB: Lessons Learned - Common Mistakes to Never Repeat

**For:** All projects (ET3AM, matrix-delivery, etc.)  
**Last Updated:** 2026-04-25

---

## 1. Configuration Files

### opencode.json

**NEVER:**
- Put API keys directly in config
- Use wrong field names like `api_key`, `models`

**ALWAYS:**
```json
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

---

## 2. GitHub Actions CI

### npm vs pnpm

**NEVER:**
- Use `cache: 'pnpm'` in setup-node with pnpm/action-setup
- Use `--frozen-lockfile` without lock files
- Assume lock files exist (for pnpm, npm)

**ALWAYS:**
- Use pnpm/action-setup only (not cache: 'pnpm')
- Simple pnpm store cache
- Use `pnpm install` without --frozen-lockfile for fresh installs

---

## 3. Firebase Deploy

**NEVER:**
```bash
firebase deploy --dir build  # WRONG
```

**ALWAYS:**
```bash
firebase deploy --only hosting --project your-project-id
```

---

## 4. AI Provider Base URLs

**Before using any provider:**
- Check official documentation
- Verify base URL format

| Provider | Base URL |
|----------|----------|
| AgentRouter | `https://agentrouter.org/` |
| OpenAI | `https://api.openai.com/v1` |
| Anthropic | `https://api.anthropic.com` |

---

## 5. Git Secrets

**NEVER:**
- Commit tokens, keys, secrets to git

**ALWAYS:**
```bash
# Check before commit
git diff --cached | grep -i "sk-\|token\|secret"
```

---

## 6. KB Documentation

| For | Location |
|-----|-----------|
| Project-specific | `docs/{project}/` |
| Shared across all | `docs/kb/` (submodule) |
| Local (not shared) | `docs/` (root) |

**Check first:**
```bash
git status
# If shows "M docs/kb" - it's a submodule
```

---

## 7. Before Every Commit

- [ ] Run backend tests: `cd backend && pnpm run test:run`
- [ ] Run frontend build: `cd frontend && pnpm run build`
- [ ] Check for secrets in staged files
- [ ] Verify config JSON validity
- [ ] Commit message follows conventional commits

---

## 8. Checklist for New Server Setup

```bash
# Required tools (always install these first)
sudo apt-get update && sudo apt-get install -y tmux gh

# Tools installed via npm
npm install -g opencode
npm install -g @anthropic-ai/claude-code
npm install -g @github/copilot
npm install -g codeforge-cli
```

---

## Related

- `docs/et3am/lessons-learned.md` - ET3AM-specific lessons
- `docs/kb/github-cli-install.md` - gh CLI guide
- `docs/kb/tmux-setup.md` - tmux guide