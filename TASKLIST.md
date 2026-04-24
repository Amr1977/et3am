# Et3am Task List

# Et3am Task List

# Et3am Task List

## In Progress
- [ ] (All tasks completed!)

## Completed (Tested)
- [x] ET3AM-001: Donation report/flag feature
- [x] ET3AM-002: Admin real-time notifications
- [x] ET3AM-003: Donor CRUD for own donations
- [x] ET3AM-004: Push notifications
- [x] ET3AM-005: Real-time stats with sound and animation
- [x] ET3AM-006: Map animations when meals added/removed
- [x] ET3AM-007: Full-screen map interaction
- [x] ET3AM-008: Apply comprehensive review (SEO, security headers, PWA)
- [x] ET3AM-009: Re-design Admin panel Donations tab
- [x] ET3AM-010: Two-level side menu for admin panel
- [x] BUG-001: Donation timezone display
- [x] BUG-002: Preserve description formatting
- [x] BUG-003: RTL text direction in descriptions
- [x] INFRA-001: CI workflow - switch from npm to pnpm
- [x] INFRA-002: Install GitHub CLI (gh) on server
- [x] INFRA-003: Authenticate GitHub CLI (gh token)
- [x] INFRA-004: Fix CI pnpm cache issues
- [x] INFRA-005: Fix frontend-deploy workflow for pnpm

## Trello Board
- All pending tasks created as cards in Trello
- See: https://trello.com/b/QA8Tk2hW/et3am

## KB Documentation
- `docs/kb/deployment/workflow-guide.md` - Project workflow
- `docs/kb/deployment/trello-integration.md` - Trello setup
- Feature specs in `docs/kb/features/`
- Bug docs in `docs/kb/bugs/`
- [x] Fix user dashboard stats (personal, not platform)
- [x] Fix address showing for receiver
- [x] Navbar hamburger visible on desktop
- [x] Admin link in side menu for admin users

---

## Recent Commits (2026)

| Commit | Description |
|--------|-------------|
| 44f5530 | docs: update INFRA-005 as done |
| 9f7aab2 | trigger: final deploy test |
| 558e21f | fix: add --project flag to firebase deploy |
| 5b0aabc | trigger: frontend deploy |
| ce64328 | fix: frontend-deploy workflow |
| bbf38d7 | docs: add INFRA-005 task |
| 141c938 | trigger: final frontend deploy test |
| 9544f42 | fix: remove invalid --dir flag from firebase deploy |
| 7dd89ad | trigger: test frontend deploy |
| 688536c | fix: update frontend deploy to use pnpm |
| 6fb0dcf | docs: update shared KB |
| a57e437 | release: bump version to 1.4.4 |
| d00d9e6 | fix: add UUID type casts for donation_id queries |
| 90bb125 | release: bump version to 1.4.3 |
| 0956fc8 | fix: change receivers to members in stats |
| fb4dc47 | release: bump version to 1.4.2 |
| 7f483b4 | fix: align brand text to side in RTL |
| b96dc60 | release: bump version to 1.4.1 |
| 762538e | fix: map centers on user location with animated marker |
| 347a316 | release: bump version to 1.4.0 |
| eeb0be8 | feat: major navbar redesign - version, logo, sidebar, settings |
| 227879f | release: bump version to 1.3.0 |
| fcc1241 | feat: move version badge below logo in navbar |
| d5d0920 | release: bump version to 1.2.0 |
| 32f29ad | feat: replace MP3 sounds with TTS notifications, fix RTL |
| eb276d4 | release: bump version to 1.1.0 |
| 76435ae | feat: add version badge to navbar with commit hash |

---

## Historical Commits (Earlier)

### Backend
- Database schema and migrations
- User authentication (JWT + Google OAuth)
- Donation CRUD operations
- Chat messaging system
- Reviews and ratings
- Support tickets
- Admin panel
- Daily reservation limits

### Frontend
- Landing page with stats
- Donations listing with map
- User dashboard
- My Donations / My Reservations
- Profile with reviews
- Settings (language, notifications)
- Mobile-responsive navbar with side menu

### Infrastructure
- Firebase hosting deployment
- PostgreSQL database (Neon/supabase)
- Firestore server registry
- Map tile caching
- Auto-versioning system

---

## Bugs Fixed
- [x] Chat crash (UUID type cast in SQL)
- [x] Home page stats incorrect (removed duplicate)
- [x] Report button missing from donation modal
- [x] Hamburger menu not visible on desktop
- [x] Address hidden for receiver after reservation

---

## How to Test

### Report Feature
1. Go to Donations page
2. Click on any donation card
3. Click "Report" button at bottom of modal
4. Select reason and submit

### Admin Panel
1. Login as admin user
2. Click "Admin Panel" in side menu
3. Access Users, Donations, Tickets tabs

### Chat
1. Reserve a donation
2. Click chat icon to open conversation
3. Send messages - no crash should occur

### Home Page Stats
1. Visit home page
2. Stats should show: Meals Given + Members (combined)
3. No duplicate "Food Donors" stat

---

## Infrastructure Updates
- [x] Multi-environment setup (dev, staging, test, production) for FE and BE