---
spec: specs/2026-08-07-login-module-design.md
parent_work_item: wi-github-26
story_index: 2
title: Implement user login token session
unpopulated: [refresh-token-strategy, token-storage-hardening]
---

## User story
As a returning shopper, I want to log in with my credentials and receive a valid session token, so that I can continue to my account area.

## Acceptance criteria
- [ ] `POST /auth/login` verifies email/password and returns a JWT access token with HS256 and a 30-minute expiry when credentials are valid.
- [ ] Login page submits `email` and `password` to `POST /auth/login`, stores the JWT in localStorage, and routes to `/dashboard` on success.
- [ ] Invalid credentials or expired/invalid token paths return HTTP 401 with `{ "detail": "..." }`.
- [ ] Login failures show inline form errors (for example, "Invalid credentials").
- [ ] [proposed] Token payload includes a stable user identifier that is sufficient for `/auth/me` to resolve the current user.

## Notes
The spec mandates access tokens but does not define refresh token behavior or hardened browser storage mechanisms.
