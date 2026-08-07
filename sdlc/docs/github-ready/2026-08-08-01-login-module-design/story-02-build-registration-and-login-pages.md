---
spec: specs/2026-08-08-01-login-module-design.md
parent_work_item: wi-github-29
story_index: 2
title: Build registration and login pages
unpopulated: []
---

## User story
As a shopper, I want registration and login forms, so that I can create an account and sign in.

## Acceptance criteria
- [ ] `/register` renders fields `full_name`, `email`, and `password`, submits to `POST /auth/register`, and navigates to `/login` after successful registration.
- [ ] `/login` renders fields `email` and `password`, submits to `POST /auth/login`, stores the returned JWT in `localStorage`, and navigates to `/dashboard` on success.
- [ ] Registration and login forms show inline error messages sourced from API error responses, including invalid credentials and email already registered scenarios.

## Notes
No additional gaps identified for this story from the approved spec.

