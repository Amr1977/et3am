# INFRA-007: Install AI Coding CLI Tools

**Status:** DONE

## Installed Tools

| Tool | Command | Version |
|------|---------|---------|
| Claude Code | `claude` | 2.1.120 |
| GitHub Copilot CLI | `copilot` | 1.0.36 |
| Forge CLI | `forge` | dev |
| KiloCode | `kilocode` | 7.1.9 |
| OpenCode | `opencode` | 1.14.22 |

## Installation Commands
```bash
npm install -g @anthropic-ai/claude-code    # Claude Code
npm install -g @github/copilot              # GitHub Copilot CLI
npm install -g codeforge-cli               # Forge CLI
```

## Path
All tools in: `~/.npm-global/bin/`

## Notes
- Gemini CLI failed to install (bundle issue)
- Aider not available (pip missing)
- All use AgentRouter via OPENAI_BASE_URL environment variable