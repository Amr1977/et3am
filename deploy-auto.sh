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
        log "Loading env from /home/ubuntu/.env"
        while IFS= read -r line || [ -n "$line" ]; do
            if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then continue; fi
            line=$(echo "$line" | tr -d '\r')
            export "$line"
        done < /home/ubuntu/.env
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
        
        BACKEND_COMMIT=$(git rev-parse HEAD)
        
        log "Checking if backend already deployed at commit: $BACKEND_COMMIT"
        
        LAST_BACKEND_COMMIT=$(node -e "
            const { initializeApp } = require('firebase/app');
            const { getFirestore, doc, getDoc } = require('firebase/firestore');
            const config = {
              apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
              authDomain: 'et3am26.firebaseapp.com',
              projectId: 'et3am26',
              storageBucket: 'et3am26.firebasestorage.app',
              messagingSenderId: '119582207501',
              appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
            };
            const app = initializeApp(config);
            const db = getFirestore(app);
            getDoc(doc(db, 'deployments', 'backend')).then(snap => {
              if (snap.exists()) {
                console.log(snap.data().commit || '');
              } else {
                console.log('');
              }
            }).catch(() => console.log(''));
        " 2>/dev/null || echo "")
        
        if [ "$LAST_BACKEND_COMMIT" = "$BACKEND_COMMIT" ]; then
            log "Backend already deployed at commit $BACKEND_COMMIT, reloading only..."
            exec_cmd cd "$PROJECT_DIR/backend"
            exec_cmd npm install --no-progress --omit=dev 2>/dev/null || true
            exec_cmd pm2 restart et3am-backend
        else
            log "Backend commit changed: $LAST_BACKEND_COMMIT -> $BACKEND_COMMIT, deploying..."
            exec_cmd cd "$PROJECT_DIR/backend"
            exec_cmd npm install --no-progress
            exec_cmd npx tsc
            exec_cmd pm2 restart et3am-backend
            
            exec_cmd node -e "
                const { initializeApp } = require('firebase/app');
                const { getFirestore, doc, setDoc } = require('firebase/firestore');
                const config = {
                  apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
                  authDomain: 'et3am26.firebaseapp.com',
                  projectId: 'et3am26',
                  storageBucket: 'et3am26.firebasestorage.app',
                  messagingSenderId: '119582207501',
                  appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
                };
                const app = initializeApp(config);
                const db = getFirestore(app);
                setDoc(doc(db, 'deployments', 'backend'), { commit: '$BACKEND_COMMIT', deployedAt: Date.now() }, { merge: true }).catch(() => {});
            "
        fi

        cd "$PROJECT_DIR"

        log "=== Frontend Deployment ==="
        cd "$PROJECT_DIR/frontend"
        
        CURRENT_COMMIT=$(git rev-parse HEAD)
        
        log "Checking if frontend already deployed at commit: $CURRENT_COMMIT"
        
        LAST_COMMIT=$(node -e "
            const { initializeApp } = require('firebase/app');
            const { getFirestore, doc, getDoc } = require('firebase/firestore');
            const config = {
              apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
              authDomain: 'et3am26.firebaseapp.com',
              projectId: 'et3am26',
              storageBucket: 'et3am26.firebasestorage.app',
              messagingSenderId: '119582207501',
              appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
            };
            const app = initializeApp(config);
            const db = getFirestore(app);
            getDoc(doc(db, 'deployments', 'frontend')).then(snap => {
              if (snap.exists()) {
                console.log(snap.data().commit || '');
              } else {
                console.log('');
              }
            }).catch(() => console.log(''));
        " 2>/dev/null || echo "")
        
        if [ "$LAST_COMMIT" = "$CURRENT_COMMIT" ]; then
            log "Frontend already deployed at commit $CURRENT_COMMIT, skipping..."
        else
            log "Frontend commit changed: $LAST_COMMIT -> $CURRENT_COMMIT, deploying..."
            exec_cmd npm install --no-progress
            exec_cmd npm run build
            if [ -n "$FIREBASE_TOKEN" ]; then
                exec_cmd npx firebase deploy --only hosting --project et3am26 --token "$FIREBASE_TOKEN"
                exec_cmd node -e "
                    const { initializeApp } = require('firebase/app');
                    const { getFirestore, doc, setDoc } = require('firebase/firestore');
                    const config = {
                      apiKey: 'AIzaSyD6L3_dHbWGYi6S_OOAitj69PLvdx2jjsI',
                      authDomain: 'et3am26.firebaseapp.com',
                      projectId: 'et3am26',
                      storageBucket: 'et3am26.firebasestorage.app',
                      messagingSenderId: '119582207501',
                      appId: '1:119582207501:web:38dc0c5e6af37acd092f44',
                    };
                    const app = initializeApp(config);
                    const db = getFirestore(app);
                    setDoc(doc(db, 'deployments', 'frontend'), { commit: '$CURRENT_COMMIT', deployedAt: Date.now() }, { merge: true }).catch(() => {});
                "
            else
                log "FIREBASE_TOKEN not set - skipping frontend deploy"
            fi
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