# INFRA-006: Configure OpenCode to Use AgentRouter

**Status:** DONE (Configuration Complete - Manual Test Required)

## Configuration

### opencode.json
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

### bashrc
```bash
export OPENAI_BASE_URL="https://agentrouter.org/"
export OPENAI_API_KEY="sk-VChazYxKrtPnAYerfRqAAMBQOieupl7IWNcuDbjOFIFIcbwp"
export MODEL="claude-sonnet-4-20250514"
```

## Available Models (from AgentRouter docs)
| Model | Input $/1M | Output $/1M |
|-------|-----------|------------|
| claude-sonnet-4-20250514 | $3 | $15 |
| claude-haiku-4-5-20251001 | $2 | $4 |
| deepseek-r1-0528 | $0.30 | $0.04 |
| gpt-5 | TBD | TBD |

## Manual Test Required
To test, run opencode in a new terminal:
```bash
source ~/.bashrc
opencode --version
```

## Notes
- AgentRouter API blocks automated requests (WAF protection)
- Uses OpenAI-compatible API format
- {env:VAR} pattern for environment variables in opencode.json