#!/bin/bash
# Et3am Backend Diagnostic Script
# Run this on the production server to diagnose the database issue

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 Et3am Backend Diagnostic Report"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Check PM2 Status
echo "1️⃣  PM2 Process Status:"
echo "─────────────────────────────────────────────────────────────"
pm2 status et3am-backend || echo "❌ et3am-backend not found in PM2"
echo ""

# 2. Check PM2 Process Details (Environment Variables)
echo "2️⃣  PM2 Process Details (Environment Variables):"
echo "─────────────────────────────────────────────────────────────"
pm2 describe et3am-backend | grep -A 20 "env:" || echo "❌ Could not get PM2 details"
echo ""

# 3. Check which .env file is being used
echo "3️⃣  Backend Directory Contents:"
echo "─────────────────────────────────────────────────────────────"
ls -la /home/ubuntu/et3am/backend/.env* 2>/dev/null || echo "❌ .env files not found"
echo ""

# 4. Check Current DATABASE_URL in .env.production
echo "4️⃣  Production Database URL (.env.production):"
echo "─────────────────────────────────────────────────────────────"
grep "DATABASE_URL" /home/ubuntu/et3am/backend/.env.production | head -c 80 && echo "..." || echo "❌ Not found"
echo ""

# 5. Test API endpoint
echo "5️⃣  Testing API Endpoint (public-stats):"
echo "─────────────────────────────────────────────────────────────"
curl -s https://api.et3am.com/api/users/public-stats | jq . 2>/dev/null || echo "❌ API call failed or jq not installed"
echo ""

# 6. Check Backend Logs
echo "6️⃣  Recent Backend Logs (last 50 lines):"
echo "─────────────────────────────────────────────────────────────"
if [ -f "/home/ubuntu/et3am/backend/backend.log" ]; then
  tail -50 /home/ubuntu/et3am/backend/backend.log
else
  echo "❌ Log file not found at /home/ubuntu/et3am/backend/backend.log"
  echo "   Try: pm2 logs et3am-backend --lines 50"
fi
echo ""

# 7. Check if backend is using correct database
echo "7️⃣  Backend Process Environment:"
echo "─────────────────────────────────────────────────────────────"
ps aux | grep -i "et3am\|node\|backend" | grep -v grep | head -5 || echo "❌ Backend process not found"
echo ""

# 8. Check Node.js version
echo "8️⃣  Node.js Version:"
echo "─────────────────────────────────────────────────────────────"
node --version
npm --version
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo "📋 Summary:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "✓ If totalDonors/totalReceivers shows 5 (correct)"
echo "  → Database connection is correct ✅"
echo ""
echo "✗ If totalDonors/totalReceivers shows 28 (wrong)"
echo "  → Backend is using wrong database ❌"
echo "  → Solution: Restart with correct .env.production"
echo "     pm2 restart et3am-backend"
echo ""
echo "If the issue persists after restart:"
echo "  1. Check NODE_ENV environment variable"
echo "  2. Verify .env.production is in /home/ubuntu/et3am/backend/"
echo "  3. Check PM2 ecosystem.config.js for env settings"
echo ""
