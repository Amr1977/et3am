#!/bin/bash
set -uo pipefail

# Auto-detect home directory (compatible with different deployment users)
# If running from within et3am/deploy-auto.sh, find the project root
SCRIPT_LOCATION="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_LOCATION")"
SCRIPT_DIR="$(dirname "$PROJECT_DIR")"
BRANCH="master"
CHECK_INTERVAL=60

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

exec_cmd() {
    export CI=true
    "$@" 2>&1 | while IFS= read -r line; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line"
    done
    return ${PIPESTATUS[0]}
}

log "---------------------------------------------------"
log "Starting Et3am Auto-Deploy Service"
log "Monitoring branch: $BRANCH"
log "Project Directory: $PROJECT_DIR"
log "---------------------------------------------------"

cd "$PROJECT_DIR"

while true; do
    if [ -f "$SCRIPT_DIR/.env" ]; then
        log "Loading env from $SCRIPT_DIR/.env"
        while IFS= read -r line || [ -n "$line" ]; do
            if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then continue; fi
            line=$(echo "$line" | tr -d '\r')
            export "$line"
        done < "$SCRIPT_DIR/.env"
    fi

    if ! git fetch origin $BRANCH > /dev/null 2>&1; then
        log "Git fetch failed"
    fi

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$BRANCH)

    if [ "$LOCAL" != "$REMOTE" ]; then
        log "New changes detected. Deploying..."

        log "Resetting and pulling..."
        cp "$SCRIPT_DIR/.env" /tmp/et3am.env.backup 2>/dev/null || true
        
        git checkout -- . 2>/dev/null || true
        git clean -fd 2>/dev/null || true
        git pull origin $BRANCH || {
            log "Git pull failed, forcing sync..."
            git fetch origin $BRANCH
            git reset --hard origin/$BRANCH
        }
        
        cp /tmp/et3am.env.backup "$SCRIPT_DIR/.env" 2>/dev/null || true

        log "=== Backend Deployment ==="
        
        BACKEND_COMMIT=$(git rev-parse HEAD)
        
        log "Checking if backend already deployed at commit: $BACKEND_COMMIT"
        
        # Note: Firestore tracking disabled - only deploying on git changes
        # All Firebase deployments are manual-only via npm run deploy
        LAST_BACKEND_COMMIT=""
        
        if [ "$LAST_BACKEND_COMMIT" = "$BACKEND_COMMIT" ]; then
            log "Backend already deployed at commit $BACKEND_COMMIT, reloading only..."
            exec_cmd cd "$PROJECT_DIR/backend"
            exec_cmd npm install --no-progress --omit=dev 2>/dev/null || true
            exec_cmd pm2 restart et3am-backend
        else
            log "Backend commit changed, deploying..."
            exec_cmd cd "$PROJECT_DIR/backend"
            exec_cmd npm install --no-progress
            exec_cmd npx tsc
            exec_cmd pm2 restart et3am-backend
        fi

        cd "$PROJECT_DIR"

        log "Deployment complete!"
    else
        MEM_PCT=$(free -m | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
        MEM_FREE=$(free -m | awk '/Mem:/ {print $7}')
        PM2_INFO=$(pm2 jlist 2>/dev/null | jq -r '.[] | "\(.name):\(.pm2_env.status)"' 2>/dev/null | tr '\n' ' ' || echo "no processes")
        log "No changes | Mem: ${MEM_PCT}% (${MEM_FREE}MB free) | PM2: ${PM2_INFO}"
    fi

    sleep $CHECK_INTERVAL
done