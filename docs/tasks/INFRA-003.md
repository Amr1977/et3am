# INFRA-003: Authenticate GitHub CLI

**Status:** PENDING

## Description
Authenticate gh CLI on matrix-vps server to check CI runs.

## Steps

Run on the server:
```bash
gh auth login --web
# Use code: 6A4F-AE08 (from previous attempt)
# Follow browser prompts
```

## Alternative (if no browser)

```bash
gh auth login
# Select: HTTPS, Login with web browser
# Or use: gh auth token (if you have a token)
```

## Verify

```bash
gh run list -L 3
gh auth status
```

## Related
- `docs/github-cli-install.md` - Installation guide