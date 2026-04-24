# KB: Tmux Setup for SSH Session Persistence

**Project:** All projects (et3am, matrix-delivery, etc.)

## Why
- SSH sessions disconnect frequently during development on VPS
- Without tmux, long-running processes (npm installs, builds, deployments) get killed
- Tmux keeps processes running even after SSH disconnect
- Essential for CI/CD workflows and large operations

## Installation

```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y tmux
```

## Usage

### Start new session
```bash
tmux new -s <session-name>
# Example: tmux new -s dev
```

### Detach from session (keep running)
Press `Ctrl+b` then `d`

### Reattach to session
```bash
tmux attach -t <session-name>
```

### List sessions
```bash
tmux ls
```

### Kill session
```bash
tmux kill-session -t <session-name>
```

## Common Commands

| Action | Shortcut |
|--------|----------|
| Detach | `Ctrl+b d` |
| Split horizontal | `Ctrl+b %` |
| Split vertical | `Ctrl+b "` |
| Navigate panes | `Ctrl+b arrow` |
| Resize pane | `Ctrl+b Ctrl+arrow` |

## Workflow Integration

1. Start tmux before large operations
2. Detach when done - process continues
3. Reattach from any location to check status

## Verification

```bash
echo $TMUX
# Should output: /tmp/tmux-1001/default,...
```

## Apply to All Projects

Add to server setup scripts:
- AWS: user data startup script
- GCP: startup script
- DigitalOcean: cloud-init