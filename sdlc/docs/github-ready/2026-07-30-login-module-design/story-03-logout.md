---
spec: spec/2026-07-30-login-module-design.md
parent_work_item: wi-github-17
story_index: 3
title: Log out of the session
unpopulated: [server-side token revocation/blocklisting — explicitly out of scope per spec's stateless design]
---

## User story
As a logged-in user, I want to log out, so that my session ends on this device.

## Acceptance criteria
- [ ] `POST /auth/logout` exists and is stateless — the server does not track or invalidate tokens; the client is solely responsible for discarding it.
- [ ] `DashboardPage` shows a logout button.
- [ ] Clicking logout clears the stored JWT (localStorage) and redirects to `/login`.
- [ ] After logout, attempting to visit `/dashboard` redirects to `/login` (no valid token present).

## Notes
Logout is intentionally stateless per the spec (no server-side session/token store). This means a token
technically remains valid until expiry even after "logout" client-side — stated explicitly as a spec
constraint, not a gap this story should silently work around.
