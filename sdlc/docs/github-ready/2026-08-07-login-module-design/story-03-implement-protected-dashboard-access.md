---
spec: specs/2026-08-07-login-module-design.md
parent_work_item: wi-github-26
story_index: 3
title: Implement protected dashboard access
unpopulated: [dashboard-business-content]
---

## User story
As an authenticated shopper, I want protected access to my dashboard and profile data, so that I can view account information securely.

## Acceptance criteria
- [ ] `/dashboard` is protected by `ProtectedRoute` and redirects unauthenticated users to `/login`.
- [ ] `GET /auth/me` requires a Bearer token and returns current user information resolved from the token.
- [ ] Dashboard calls `GET /auth/me` and displays user info when token validation succeeds.
- [ ] Global axios 401 handling clears local token state and redirects to `/login`.
- [ ] [proposed] If `/auth/me` fails with non-401 auth-adjacent errors, dashboard shows a recoverable inline error state instead of a blank view.

## Notes
The spec defines dashboard routing and identity display but treats dashboard content as a stub.
