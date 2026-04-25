# KB: AI Coding CLI Tools Installed

**Server:** matrix-vps

## Installed Tools

| Tool | Version | Command | Provider |
|------|---------|---------|----------|
| Claude Code | 2.1.120 | `claude` | Anthropic (AgentRouter) |
| GitHub Copilot CLI | 1.0.36 | `copilot` | OpenAI |
| Forge CLI | dev | `forge` | OpenAI |
| KiloCode | 7.1.9 | `kilocode` | AgentRouter |
| OpenCode | 1.14.22 | `opencode` | AgentRouter |

## Configuration

### AgentRouter Setup
```bash
export OPENAI_BASE_URL="https://agentrouter.org/"
export OPENAI_API_KEY="sk-VChaz..."
export MODEL="claude-sonnet-4-20250514"
```

### Claude Code (claude)
Uses AgentRouter via ANTHROPIC_BASE_URL:
```bash
export ANTHROPIC_BASE_URL="https://agentrouter.org/"
export ANTHROPIC_API_KEY="sk-VChaz..."
```

### Copilot CLI
Uses OpenAI API - set in `~/.config/copilot/config.json`

### Forge CLI
Uses OpenAI API - configure with:
```bash
forge config set OPENAI_API_KEY=sk-...
```

## Installation
```bash
npm install -g @anthropic-ai/claude-code    # Claude Code
npm install -g @github/copilot              # GitHub Copilot CLI
npm install -g codeforge-cli               # Forge CLI
npm install -g kilocode                   # KiloCode (via npx)
```

## Path
All tools installed in: `~/.npm-global/bin/`