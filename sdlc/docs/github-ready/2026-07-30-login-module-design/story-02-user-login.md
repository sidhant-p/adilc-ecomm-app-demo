---
spec: spec/2026-07-30-login-module-design.md
parent_work_item: wi-github-17
story_index: 2
title: Log in with email and password
unpopulated: [JWT refresh-token behavior, "remember me" / long-lived session support, account lockout after repeated failures]
---

## User story
As a registered user, I want to log in with my email and password, so that I receive an access token and can reach my dashboard.

## Acceptance criteria
- [ ] `POST /auth/login` verifies credentials and returns a JWT access token on success.
- [ ] JWT is signed HS256, expires after 30 minutes, with the signing secret read from `.env`.
- [ ] Invalid/expired credentials return HTTP 401 with a `{ "detail": "..." }` body.
- [ ] `LoginPage` at route `/login` presents a form with `email` and `password` fields.
- [ ] On successful login, the JWT is stored (localStorage) and the user is navigated to `/dashboard`.
- [ ] On failure, an inline error message is shown on the form (e.g. "Invalid credentials").
- [ ] `.env` (holding the JWT secret) is never committed to source control.

## Notes
Depends on story 1 (registration) existing so a user has credentials to log in with. No spec detail on
token refresh or persistent "remember me" sessions — flagged as unpopulated rather than assumed.
