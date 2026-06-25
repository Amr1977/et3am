# BUG-002: Chat Endless Loading Fix

**Trello:** [Link](https://trello.com/b/QA8Tk2hW/et3am)
**Status:** DONE

## Description

Chat component showed endless loading spinner. Three root causes identified and fixed:

### Root Causes

1. **`text = uuid` SQL Error** - Chat DB queries had `::uuid` casts on `request_id` and `donation_id` parameters, but `chat_messages.donation_id` is TEXT type (not UUID). This caused `operator does not exist: text = uuid` PostgreSQL error, crashing the chat query.

2. **`fetchWithFailover` Infinite Recursion** - When all servers returned 5xx, `fetchWithFailover` recursed without a retry limit, causing infinite retries. No timeout was set either, so it could hang forever.

3. **Chat.tsx Early Returns Left `loading=true`** - The component had early `return` statements in useEffect that bailed out without calling `setLoading(false)` or `setError()`, leaving the spinner visible forever.

### Fixes Applied

#### `backend/src/database.ts`
- Removed `::uuid` casts from `findByDonation` and `findByRequest` chat queries
- `chat_messages.donation_id` is TEXT, so `::uuid` cast caused `text = uuid` comparison error

#### `backend/src/routes/chat.ts`
- Added IDOR prevention: participation check in `PUT /chat/:donationId/read`

#### `backend/src/config/socket.ts`
- Added IDOR prevention: participation check in socket `send_message` event

#### `frontend/src/services/api.ts`
- Added `MAX_RETRIES = 2` to prevent infinite recursion
- Added `AbortController` with 15s timeout per attempt
- Added error state tracking to signal failure to caller

#### `frontend/src/pages/Chat.tsx`
- Changed early returns to call `setLoading(false)` and `setError()` before returning
- Added explicit error message for non-ok HTTP responses

### Files Changed
- `backend/src/database.ts`
- `backend/src/routes/chat.ts`
- `backend/src/config/socket.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/Chat.tsx`
- `frontend/tests/e2e/chat-loading.bug.e2e.ts` (new)

## Action Log
| Date | Action | Result |
|------|--------|--------|
| 2026-06-25 | Identified `text = uuid` error in server logs | Found `::uuid` on TEXT column |
| 2026-06-25 | Removed `::uuid` casts from chat queries | Initial deploy |
| 2026-06-25 | Identified missing IDOR checks in chat endpoints | Added participation checks |
| 2026-06-25 | Identified `fetchWithFailover` infinite recursion | Added MAX_RETRIES + timeout |
| 2026-06-25 | Identified Chat.tsx early return bug | Added setLoading(false)/setError() |
| 2026-06-25 | Created E2E test | `chat-loading.bug.e2e.ts` |
| 2026-06-25 | Deployed frontend + restarted backend | Firebase + PM2 |
| 2026-06-25 | Run backend tests | 68/68 PASS |

## Tests
- Backend: 68/68 PASS
- Frontend Build: PASS
- E2E (chat loading): 1/3 PASS (2 require Chromium, not available on VPS)

## Deployment
- [x] AWS (PM2 restart)
- [x] Firebase (frontend deploy)

## Learnings
- `chat_messages.donation_id` is TEXT but `request_id` is UUID - different column types in the same table
- Always add a retry limit to recursive retry functions
- Early returns in React effects must clean up loading/error state
