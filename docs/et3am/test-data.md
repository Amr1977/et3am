# ET3AM Test Data & Accounts

**Project:** ET3AM - Food Donation Platform  
**Last Updated:** 2026-04-25

---

## Test Accounts

**⚠️ IMPORTANT:** Never commit real credentials or test accounts to git.

### Using Test Accounts

Test accounts are configured in backend `.env`:
```bash
cd backend
cat .env | grep TEST
```

### Creating Test Accounts

1. **Via Backend Seed Script:**
```bash
cd backend
pnpm run seed:test
```

2. **Via Frontend UI:**
- Navigate to `/register`
- Use test email format: `test+{role}@example.com`

---

## Test Donation Data

### Sample Donation for Testing

```javascript
{
  title: "Test Meal - Arabic مشروع تجريبي",
  description: "Freshly prepared meals for testing purposes",
  address: "123 Test Street, City",
  latitude: 31.9539,  // Cairo coordinates
  longitude: 35.9100,
  startTime: "2026-04-25T10:00:00Z",
  endTime: "2026-04-25T14:00:00Z",
  servings: 5
}
```

### Geolocation Test Points

| City | Lat | Lng | Test Scenario |
|------|-----|-----|---------------|
| Cairo | 31.9539 | 35.9100 | Main test location |
| Alexandria | 31.2001 | 29.9187 | Distance filtering |
| Giza | 30.0131 | 31.2089 | Nearby donations |

---

## Test Database

**Database:** PostgreSQL on Neon.tech  
**Test Schema:** `et3am_test` (or use `et3am_dev` with cleanup)

### Database Seeding

```bash
# Seed test data
cd backend
pnpm run db:seed

# Reset database
pnpm run db:reset
```

---

## Test Environments

| Environment | URL | Backend | Database |
|-------------|-----|--------|----------|
| Development | localhost:5173 | localhost:3000 | Dev DB |
| Production | foodshare777.web.app | api.et3am.com | Prod DB |

### Staging Environments
- Staging FE: `foodshare777-staging.web.app`
- Test BE: `matrix-delivery-api-gc.mywire.org`

---

## Test Mobile Devices

| Device | Width | Height | Test Case |
|--------|-------|--------|----------|
| iPhone SE | 375 | 667 | Small screen |
| iPhone 14 | 390 | 844 | Standard |
| iPad | 768 | 1024 | Tablet |

**Playwright viewport:**
```javascript
await page.setViewportSize({ width: 390, height: 844 });
```

---

## Related Documents

- `docs/kb/et3am/happy-path.md` - Complete happy path
- `frontend/tests/e2e/test-utils.ts` - Test utilities
- `.github/workflows/ci.yml` - CI test commands