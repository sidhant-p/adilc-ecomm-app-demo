---
spec: specs/2026-08-08-01-login-module-design.md
parent_work_item: wi-github-29
story_index: 3
title: Protect dashboard and session flow
unpopulated: ["Whether logout must call /auth/logout before client-side token removal"]
---

## User story
As an authenticated shopper, I want guarded dashboard access and session handling, so that unauthorized users cannot access protected screens.

## Acceptance criteria
- [ ] `/dashboard` is protected by `ProtectedRoute` and redirects to `/login` when a JWT is absent in `localStorage`.
- [ ] `DashboardPage` calls `GET /auth/me` with Bearer token and shows current user info on success.
- [ ] Axios JWT interceptor handles HTTP 401 responses globally by clearing stored token and redirecting to `/login`.
- [ ] Logout functionality removes the JWT from client storage and returns the user to the login flow.
- [ ] [proposed] Logout action also invokes `POST /auth/logout` before clearing local token state.

## Notes
The spec defines logout behavior as stateless token discard but does not explicitly require whether the frontend must call `/auth/logout`.

