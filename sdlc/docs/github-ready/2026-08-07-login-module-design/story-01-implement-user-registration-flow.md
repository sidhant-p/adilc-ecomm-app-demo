---
spec: specs/2026-08-07-login-module-design.md
parent_work_item: wi-github-26
story_index: 1
title: Implement user registration flow
unpopulated: [password-policy, rate-limiting]
---

## User story
As a new shopper, I want to create an account with my name, email, and password, so that I can access authenticated features.

## Acceptance criteria
- [ ] `POST /auth/register` creates a user with unique email, stores only a bcrypt-hashed password, and returns HTTP 201 on success.
- [ ] Register page submits `full_name`, `email`, and `password` to `POST /auth/register`, then routes successful users to `/login`.
- [ ] Duplicate email registration returns HTTP 409 with `{ "detail": "..." }` and shows an inline form error.
- [ ] [proposed] Registration validation failures return field-level inline messages on the Register page for all invalid inputs.

## Notes
The spec defines required fields but does not define password complexity rules or anti-abuse controls.
