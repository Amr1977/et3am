#!/bin/bash
set -uo pipefail

PROJECT_DIR="/home/ubuntu/et3am"
SCRIPT_DIR="/home/ubuntu"
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
    if [ -f /home/ubuntu/.env ]; then
        log "Loading env from .env"
        while IFS= read -r line || [ -n "$line" ]; do
            if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then continue; fi
            line=$(echo "$line" | tr -d '\r')
            export "$line"
        done < .env
    fi

    if ! git fetch origin $BRANCH > /dev/null 2>&1; then
        log "Git fetch failed"
    fi

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$BRANCH)

    if [ "$LOCAL" != "$REMOTE" ]; then
        log "New changes detected. Deploying..."

        log "Resetting and pulling..."
        cp /home/ubuntu/.env /tmp/et3am.env.backup 2>/dev/null || true
        
        git checkout -- . 2>/dev/null || true
        git clean -fd 2>/dev/null || true
        git pull origin $BRANCH || {
            log "Git pull failed, forcing sync..."
            git fetch origin $BRANCH
            git reset --hard origin/$BRANCH
        }
        
        cp /tmp/et3am.env.backup /home/ubuntu/.env 2>/dev/null || true

        log "=== Backend Deployment ==="
        cd "$PROJECT_DIR/backend"
        exec_cmd npm install --no-progress
        exec_cmd npx tsc

        log "Reloading backend via PM2..."
        exec_cmd pm2 restart et3am-backend || exec_cmd pm2 start "$PROJECT_DIR/et3am-ecosystem.config.js"

        cd "$PROJECT_DIR"

        log "=== Frontend Deployment ==="
        cd "$PROJECT_DIR/frontend"
        exec_cmd npm install --no-progress
        exec_cmd npm run build
        if [ -n "$FIREBASE_TOKEN" ]; then
            exec_cmd npx firebase deploy --only hosting --project et3am26 --token "$FIREBASE_TOKEN"
        else
            log "FIREBASE_TOKEN not set - skipping frontend deploy"
        fi

        log "Deployment complete!"
    else
        MEM_PCT=$(free -m | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
        MEM_FREE=$(free -m | awk '/Mem:/ {print $7}')
        PM2_INFO=$(pm2 jlist 2>/dev/null | jq -r '.[] | "\(.name):\(.pm2_env.status)"' 2>/dev/null | tr '\n' ' ' || echo "no processes")
        log "No changes | Mem: ${MEM_PCT}% (${MEM_FREE}MB free) | PM2: ${PM2_INFO}"
    fi

    sleep $CHECK_INTERVAL
done