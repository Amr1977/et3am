# INFRA-002: Install GitHub CLI (gh) on Server

**Status:** DONE

## Description
Install GitHub CLI on matrix-vps server to check CI/CD status and run workflows.

## Solution
```bash
sudo apt-get update
sudo apt-get install -y gh
```

## Authentication
```bash
gh auth login
# Follow web browser authentication
```

## Usage
```bash
gh run list -L 3       # Check recent runs
gh run view <id>       # Get run details
```

## Related KB
- `docs/kb/github-cli-install.md`