# KB: Install GitHub CLI on New Machines

**Project:** et3am (and applicable to all projects)

## Why
- `gh` CLI needed to check CI/CD status, run status, manage releases
- Required for checking if GitHub Actions deployments succeed

## Installation

```bash
sudo apt-get update
sudo apt-get install -y gh
```

## Authentication

```bash
gh auth login
# Follow prompts:
# - HTTPS auth
# - Login with web browser
# - Paste auth code
```

## Verify

```bash
gh run list -L 3
gh run view <run-id>
```

## Usage in CI Workflow

After any commit, check if CI passes:
```bash
gh run list -L 1
```

Get deployment status from workflow runs.