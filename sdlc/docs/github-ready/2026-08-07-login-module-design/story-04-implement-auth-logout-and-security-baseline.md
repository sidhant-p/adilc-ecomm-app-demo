---
spec: specs/2026-08-07-login-module-design.md
parent_work_item: wi-github-26
story_index: 4
title: Implement auth logout and security baseline
unpopulated: [audit-logging, secret-rotation]
---

## User story
As a shopper, I want to safely end my authenticated session and rely on secure auth defaults, so that my account remains protected on shared or unsafe devices.

## Acceptance criteria
- [ ] Logout flow is stateless: `POST /auth/logout` does not require token invalidation and the client discards stored JWT.
- [ ] Dashboard provides a Logout action that clears client auth state and routes to `/login`.
- [ ] JWT secret is sourced from `.env` and not committed to the repository.
- [ ] `.env` and `backend/ecomm.db` are gitignored.
- [ ] Backend CORS allows `http://localhost:5173` for development.
- [ ] [proposed] Application startup fails fast when JWT secret is missing or empty.

## Notes
The spec defines baseline security and logout behavior but does not define key rotation or auth event auditing.
