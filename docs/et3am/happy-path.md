# ET3AM Happy Path - Complete Flow Documentation

**Project:** ET3AM - Food Donation Platform  
**Repository:** github.com/Amr1977/et3am  
**Production:** https://foodshare777.web.app  
**Backend:** api.et3am.com (AWS) + matrix-delivery-api-gc.mywire.org (GCP)

---

## Overview

The complete happy path covers the full donation lifecycle from user registration through donation completion. All steps have corresponding test coverage in `frontend/tests/e2e/` and `backend/src/routes/*.test.ts`.

---

## Happy Path Steps

### Step 1: User Registration & Authentication

**Flow:** Sign Up → Email Verification → Login

**Files:**
- `frontend/src/pages/Register.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/tests/e2e/user-authentication.e2e.ts`
- `backend/src/routes/auth.test.ts`

**Expected Outcomes:**
- [ ] User can register with email/password
- [ ] Google OAuth login works
- [ ] JWT token issued on login
- [ ] User profile created in database

**Test Command:**
```bash
cd frontend && pnpm playwright test tests/e2e/user-authentication.e2e.ts
```

---

### Step 2: Create Donation

**Flow:** Donor creates meal donation → Validates → Saves to DB → Shows on map

**Files:**
- `frontend/src/pages/Donations.tsx`
- `frontend/src/components/CreateDonation.tsx`
- `backend/src/routes/donations.ts`
- `backend/src/routes/donations.test.ts`

**Expected Outcomes:**
- [ ] Donation form captures: title, description, address, start/end time
- [ ] Location geocoded from address
- [ ] Donation saved with status `available`
- [ ] Appears on home page map and donations grid
- [ ] Real-time update via WebSocket (if connected)

**Test Command:**
```bash
cd backend && pnpm run test:run -- donations.test.ts
```

---

### Step 3: Reserve Donation

**Flow:** Receiver finds donation → Reserves → Status changes to `reserved`

**Files:**
- `frontend/src/pages/DonationPage.tsx`
- `frontend/tests/e2e/reservations-flow.e2e.ts`
- `backend/src/routes/reservations.ts`

**Expected Outcomes:**
- [ ] Receiver sees "Reserve" button on available donations
- [ ] Clicking reserve shows confirmation dialog
- [ ] On confirm: status changes to `reserved`
- [ ] Hash code generated (5-digit pickup code)
- [ ] Donor receives notification

**Test Command:**
```bash
cd frontend && pnpm playwright test tests/e2e/reservations-flow.e2e.ts
```

---

### Step 4: Hash Code Exchange

**Flow:** Both parties see unique 5-digit pickup code

**Files:**
- `frontend/src/pages/DonationPage.tsx`
- `frontend/src/pages/MyReservations.tsx`
- Backend: hash generation in donations service

**Expected Outcomes:**
- [ ] Donor sees hash code on their donation page (after reservation)
- [ ] Receiver sees hash code in My Reservations
- [ ] Codes match for verification
- [ ] Hash codes are unique per reservation

---

### Step 5: In-App Chat

**Flow:** Donor and receiver can chat about pickup

**Files:**
- `frontend/src/components/Chat.tsx`
- `frontend/tests/e2e/chat-system.e2e.ts`
- `backend/src/routes/chat.ts`

**Expected Outcomes:**
- [ ] Chat icon visible after reservation
- [ ] Messages sent/received in real-time
- [ ] No crashes on UUID parsing (BUG-001 fixed)
- [ ] Chat history persisted

**Test Command:**
```bash
cd frontend && pnpm playwright test tests/e2e/chat-system.e2e.ts
```

---

### Step 6: Complete Donation

**Flow:** Donor marks as delivered → Transaction complete

**Files:**
- `frontend/src/pages/DonationPage.tsx`
- `frontend/tests/e2e/donation-flow-complete.e2e.ts`
- `backend/src/routes/donations.ts`

**Expected Outcomes:**
- [ ] Donor sees "Mark Delivered" button on reserved donations
- [ ] Clicking shows confirmation dialog
- [ ] Status changes to `completed`
- [ ] Both parties see completion notification
- [ ] Stats updated (meals given incremented)

**Test Command:**
```bash
cd frontend && pnpm playwright test tests/e2e/donation-flow-complete.e2e.ts
```

---

## Complete E2E Test

Run full happy path end-to-end:
```bash
cd frontend && pnpm playwright test tests/e2e/donation-flow-complete.e2e.ts
```

This test performs: Sign Up → Create Donation → Reserve → Chat → Complete

---

## Admin Happy Path

### Admin Notifications

**Flow:** Admin receives real-time notifications for:
- New user registration
- New donation created
- Donation reserved
- Donation completed

**Files:**
- `frontend/src/components/AdminNotification.tsx`
- `backend/src/routes/admin.ts`

### Admin Management

**Flow:** Admin panel → Manage users/donations/tickets/crashes

**Files:**
- `frontend/src/pages/Admin.tsx`
- `frontend/tests/e2e/admin-dashboard.e2e.ts`

---

## CI/CD Status

| Workflow | Status |
|----------|--------|
| CI (all 4 jobs) | ✓ PASS |
| Frontend Deploy | ✓ PASS |

Last verified: 2026-04-25

---

## Known Features by ET3AM ID

| Feature | Happy Path Step |
|---------|----------------|
| ET3AM-001: Donation report/flag | Side path (optional) |
| ET3AM-002: Admin notifications | Admin Happy Path |
| ET3AM-003: Donor CRUD | Step 2 |
| ET3AM-004: Push notifications | Steps 3, 6 |
| ET3AM-005: Real-time stats | Home page |
| ET3AM-006: Map animations | Steps 2, 3 |
| ET3AM-007: Full-screen map | Home/Donations |
| ET3AM-008: Comprehensive review | Infrastructure |
| ET3AM-009: Admin donations redesign | Admin Happy Path |
| ET3AM-010: Two-level admin menu | Admin Happy Path |
| ET3AM-011: Placeholder MP3 sounds | Home page |

---

## Related Documents

- `docs/kb/et3am/test-data.md` - Test accounts and sample data
- `docs/kb/et3am/features/ET3AM-012-happy-path.md` - Feature integration matrix
- `docs/tasks/INFRA-00*.md` - Infrastructure tasks
- `frontend/tests/e2e/donation-flow-complete.e2e.ts` - Full E2E test