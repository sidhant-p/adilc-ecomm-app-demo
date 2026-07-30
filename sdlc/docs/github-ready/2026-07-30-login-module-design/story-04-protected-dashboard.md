---
spec: spec/2026-07-30-login-module-design.md
parent_work_item: wi-github-17
story_index: 4
title: View protected dashboard after login
unpopulated: [exact dashboard UI content/layout beyond "user info", behavior when token expires mid-session beyond global 401 handling]
---

## User story
As a logged-in user, I want a protected dashboard that shows my account info, so that I know I'm authenticated and can see my profile.

## Acceptance criteria
- [ ] `GET /auth/me` requires a Bearer token and returns the current user's info decoded from the JWT.
- [ ] `DashboardPage` at route `/dashboard` is protected: `ProtectedRoute` checks localStorage for a JWT and redirects unauthenticated visitors to `/login`.
- [ ] `DashboardPage` calls `GET /auth/me` on load and displays the returned user info (e.g. `full_name`, `email`).
- [ ] A global Axios interceptor catches any HTTP 401 response, clears the stored token, and redirects to `/login`.
- [ ] [proposed] A loading state is shown while `GET /auth/me` is in flight.

## Notes
This is the "dashboard stub" called out in the spec — scope is limited to displaying authenticated user
info and enforcing route protection; no further dashboard functionality (orders, products, etc.) is
described and none should be assumed.
