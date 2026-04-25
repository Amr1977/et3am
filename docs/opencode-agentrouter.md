# KB: OpenCode with AgentRouter Configuration

**Applies to:** All projects using AgentRouter as AI provider

## Setup

### 1. Add to ~/.bashrc
```bash
export OPENAI_BASE_URL="https://agentrouter.org/"
export OPENAI_API_KEY="sk-your-key"
export MODEL="claude-sonnet-4-20250514"
```

### 2. Update opencode.json
```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["AGENTS.md", "docs/kb/README.md"],
  "autoupdate": true,
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

## Key Points
- Use `{env:VAR}` pattern to reference environment variables
- Never put API keys directly in opencode.json
- AgentRouter uses OpenAI-compatible API format
- Base URL is `https://agentrouter.org/` (NOT api.agentrouter.ai)

## Switching Models
Change the MODEL variable in bashrc:
```bash
export MODEL="claude-haiku-4-5-20251001"  # Fast/cheap
export MODEL="deepseek-r1-0528"          # Cheapest reasoning
```