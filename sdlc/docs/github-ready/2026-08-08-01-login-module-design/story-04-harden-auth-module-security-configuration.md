---
spec: specs/2026-08-08-01-login-module-design.md
parent_work_item: wi-github-29
story_index: 4
title: Harden auth module security configuration
unpopulated: []
---

## User story
As a developer, I want secure auth configuration defaults, so that sensitive data is protected and local development behavior stays constrained.

## Acceptance criteria
- [ ] Backend CORS configuration allows `http://localhost:5173` in development and does not permit arbitrary origins.
- [ ] JWT secret is sourced from `.env` and is never committed as plaintext in repository code.
- [ ] Passwords are hashed with `bcrypt` via `passlib` and are never persisted in plaintext.
- [ ] `.env` and `ecomm.db` are ignored by git.

## Notes
No additional gaps identified for this story from the approved spec.

