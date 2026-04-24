# INFRA-003: Authenticate GitHub CLI

**Status:** DONE

## Description
Authenticate gh CLI on matrix-vps server to check CI runs.

## Solution
```bash
gh auth login --with-token
# Paste your GitHub PAT token
```

Token stored in `~/.bashrc` as `GH_TOKEN`.

## Verify
```bash
gh run list -L 3
gh auth status
```

## Related
- `docs/github-cli-install.md` - Installation guide