---
spec: specs/2026-08-08-01-login-module-design.md
parent_work_item: wi-github-29
story_index: 1
title: Implement authentication API and user persistence
unpopulated: ["Exact success response payloads for /auth/register and /auth/logout"]
---

## User story
As a shopper, I want secure account registration and login APIs, so that I can access my account safely.

## Acceptance criteria
- [ ] `POST /auth/register` creates a user record in SQLite with unique `email`, stores `hashed_password` (not plaintext), and returns HTTP 201; duplicate email returns HTTP 409 with `{ "detail": "..." }`.
- [ ] `POST /auth/login` validates credentials and returns a JWT access token; bad credentials return HTTP 401 with `{ "detail": "..." }`.
- [ ] JWT tokens are signed with HS256, expire after 30 minutes, and use a secret loaded from `.env`.
- [ ] `GET /auth/me` requires Bearer auth and returns current user info from token context; invalid or expired tokens return HTTP 401 with `{ "detail": "..." }`.
- [ ] [proposed] `POST /auth/logout` returns an explicit success response while remaining stateless (client-side token discard, no token revocation store).

## Notes
The spec defines logout as stateless but does not define the exact logout success payload.
