# Server Configuration

## IMPORTANT: Multiple Projects Per Server

Both servers host **multiple projects**. Always verify the correct project path and PM2 process name before deploying or restarting. Incorrectly targeting the wrong process will affect other projects.

---

## Et3am Backend Deployment Servers

### Server 1: AWS (api.et3am.com) — NEW
- **Hostname:** commerce-api.et3am.com (SSH) / api.et3am.com (backend)
- **User:** ec2-user
- **SSH Key:** Configured in SSH agent (just connect)
- **Public IP:** 13.60.80.165
- **Project Path:** /home/ec2-user/et3am
- **Backend Dir:** /home/ec2-user/et3am/backend
- **Backend Port:** 3002 (3000=commerce-backend, 3001=hafsa-backend)
- **PM2 App Name:** et3am-backend
- **PM2 Mode:** fork (not cluster)
- **PM2 Config:** started directly (no ecosystem file), cwd=/home/ec2-user/et3am/backend
- **Database:** Neon PostgreSQL via DATABASE_URL in .env.production
- **Other Projects on Server:** commerce-backend (port 3000), hafsa-backend (port 3001)

### Server 2: GCP (matrix-delivery-api-gc.mywire.org) — CURRENTLY UNREACHABLE
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

# AWS - Et3am ONLY (includes build)
ssh ec2-user@commerce-api.et3am.com "cd /home/ec2-user/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install --omit=dev && npm run build && pm2 restart et3am-backend"

# GCP - Et3am ONLY (currently unreachable)
# ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "cd /home/amr_lotfy_othman/et3am && git fetch origin master && git reset --hard origin/master && cd backend && npm install --omit=dev && npm run build && pm2 restart et3am-backend"
```

**Important:**
- Backend is TypeScript and requires `npm install && npm run build` before running.
- On the AWS server, the et3am-backend runs on **port 3002** (not 3001). Port 3000 is used by commerce-backend, port 3001 by hafsa-backend.
- The .env.production file must have `PORT=3002` and the correct DATABASE_URL.
- Never stop/restart commerce-backend or hafsa-backend — they are separate projects.
- After `git reset --hard`, the .env.production and firebase-service-account.json files must be re-copied (they are not tracked in git).

### Check running processes before deploying:
```bash
ssh ec2-user@commerce-api.et3am.com "pm2 list"
# ssh amr_lotfy_othman@matrix-delivery-api-gc.mywire.org "pm2 list" (GCP unreachable)
```

---

## Other Projects (for reference)

### matrix-delivery-backend
- **Server 1 PM2:** matrix-delivery-backend (cluster mode, 4 instances)
- **Server 2 PM2:** matrix-delivery-backend (cluster mode, 2 instances)
- **Repo:** github.com/Amr1977/matrix-delivery
