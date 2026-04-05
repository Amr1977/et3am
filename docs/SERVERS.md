# Server Configuration

## IMPORTANT: Multiple Projects Per Server

Both servers host **multiple projects**. Always verify the correct project path and PM2 process name before deploying or restarting. Incorrectly targeting the wrong process will affect other projects.

---

## Et3am Backend Deployment Servers

### Server 1: AWS (api.et3am.com)
- **Hostname:** api.et3am.com
- **User:** ubuntu
- **SSH Key:** Configured in SSH agent (just connect)
- **Project Path:** /home/ubuntu/et3am
- **Backend Dir:** /home/ubuntu/et3am/backend
- **PM2 App Name:** et3am-backend
- **Other Projects on Server:** auto-deploy, matrix-delivery-backend

### Server 2: GCP (matrix-delivery-api-gc.mywire.org)
- **Hostname:** matrix-delivery-api-gc.mywire.org
- **User:** amr_lotfy_othman
- **SSH Key:** Configured in SSH agent (just connect)
- **Project Path:** /home/amr_lotfy_othman/et3am
- **Backend Dir:** /home/amr_lotfy_othman/et3am/backend
- **PM2 App Name:** et3am-backend
- **Other Projects on Server:** auto-deploy, matrix-delivery-backend

---

## Deployment Commands

### Quick Deploy (using script)
```bash
# Requires build (npm run build) before restart
./deploy-backend.sh
```
**Note:** The script runs `npm install --omit=dev && npm run build && pm2 restart et3am-backend` on both servers.

### Manual Deploy (command line)
```bash
# Push code first
git push origin master

# Server 1 - Et3am ONLY (includes build)
ssh ubuntu@api.et3am.com "cd /home/ubuntu/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install --omit=dev && npm run build && pm2 restart et3am-backend"

# Server 2 - Et3am ONLY (includes build)
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "cd /home/amr_lotfy_othman/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install --omit=dev && npm run build && pm2 restart et3am-backend"
```

**Important:** Backend is TypeScript and requires `npm run build` before running. Do not skip the build step.

### Check running processes before deploying:
```bash
ssh ubuntu@api.et3am.com "pm2 list"
ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "pm2 list"
```

---

## Other Projects (for reference)

### matrix-delivery-backend
- **Server 1 PM2:** matrix-delivery-backend (cluster mode, 4 instances)
- **Server 2 PM2:** matrix-delivery-backend (cluster mode, 2 instances)
- **Repo:** github.com/Amr1977/matrix-delivery
