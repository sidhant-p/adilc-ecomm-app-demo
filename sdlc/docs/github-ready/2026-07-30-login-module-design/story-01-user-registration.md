---
spec: spec/2026-07-30-login-module-design.md
parent_work_item: wi-github-17
story_index: 1
title: Register a new user login account
unpopulated: [UI copy/wording for error messages, password strength rules, rate limiting on registration endpoint]
---

## User story
As a new visitor, I want to register an account with my name, email, and password, so that I can access the e-commerce site as a logged-in user.

## Acceptance criteria
- [ ] `POST /auth/register` creates a user, hashes the password with `bcrypt` (via `passlib`), and returns HTTP 201 on success.
- [ ] User table stores `id`, `email` (unique), `hashed_password`, `full_name`, `created_at`.
- [ ] Duplicate email on registration returns HTTP 409 with a `{ "detail": "..." }` body.
- [ ] Validation errors (e.g. missing/malformed fields) return HTTP 400 with a `{ "detail": "..." }` body.
- [ ] `RegisterPage` at route `/register` presents a form with `full_name`, `email`, `password` fields.
- [ ] On successful registration, the user is navigated to `/login`.
- [ ] On failure, an inline error message is shown on the form (e.g. "Email already registered").
- [ ] Password is never stored or logged in plaintext.
- [ ] [proposed] Registration form performs basic client-side validation (required fields, email format) before submitting.

## Notes
The spec's naming convention differs from the configured `spec.dir` (`specs`) — the actual approved spec
lives at `spec/2026-07-30-login-module-design.md` (singular `spec/`, dated-slug filename, not `<id>.md`).
Flagging this as a config/repo drift note rather than failing loud, since the file's own intake-mapping
section confirms it corresponds to tracking issue #17.
