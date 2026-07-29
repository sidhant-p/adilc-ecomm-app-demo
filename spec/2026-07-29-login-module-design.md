# Login Module — Design Doc

**Date:** 2026-07-20  
**Topic:** Ecomm Login Module (Frontend + Backend)  
**Status:** Approved

---

## Overview

A standalone login module for an e-commerce application. Covers user registration, login, logout, and a post-login dashboard stub. Frontend is React (Vite). Backend is Python FastAPI with SQLite storage and JWT authentication.

---

## Architecture

**Monorepo layout:**
```
adilc-ecomm-app-demo/
├── frontend/          # React + Vite (port 5173)
│   └── src/
│       ├── pages/         # LoginPage, RegisterPage, DashboardPage
│       ├── components/    # AuthForm, ProtectedRoute
│       └── api/           # axios client with JWT interceptor
└── backend/           # FastAPI (port 8000)
    ├── main.py
    ├── routers/auth.py
    ├── models.py          # SQLAlchemy User model
    ├── schemas.py         # Pydantic request/response schemas
    ├── auth.py            # JWT create/verify utilities
    ├── database.py        # SQLite engine + session factory
    └── ecomm.db           # SQLite file (gitignored)
```

Frontend and backend run independently. React calls the FastAPI REST API. CORS configured to allow `http://localhost:5173`.

---

## Backend API

| Method | Path           | Auth Required | Description                                      |
|--------|----------------|---------------|--------------------------------------------------|
| POST   | /auth/register | No            | Create user, hash password, return 201           |
| POST   | /auth/login    | No            | Verify credentials, return JWT access token      |
| POST   | /auth/logout   | No            | Stateless — client discards token                |
| GET    | /auth/me       | Yes (Bearer)  | Return current user info from token              |

**User table fields:** `id`, `email` (unique), `hashed_password`, `full_name`, `created_at`

- JWT: HS256, 30-minute expiry, secret from `.env`
- Passwords: hashed with `bcrypt` via `passlib`

---

## Frontend Pages & Flow

| Route        | Page            | Description                                                        |
|--------------|-----------------|--------------------------------------------------------------------|
| /register    | RegisterPage    | Form: full_name, email, password → POST /auth/register → /login  |
| /login       | LoginPage       | Form: email, password → POST /auth/login → store JWT → /dashboard |
| /dashboard   | DashboardPage   | Protected. GET /auth/me to show user info. Logout button.          |

- **ProtectedRoute:** Checks localStorage for JWT; redirects to `/login` if absent.
- **Axios interceptor:** Catches 401 globally → clears token → redirects to login.
- **Inline error messages** on forms (e.g., "Invalid credentials", "Email already registered").

---

## Error Handling

| Scenario                  | HTTP Status | Response body              |
|---------------------------|-------------|----------------------------|
| Validation error          | 400         | `{ "detail": "..." }`      |
| Bad credentials / expired | 401         | `{ "detail": "..." }`      |
| Duplicate email           | 409         | `{ "detail": "..." }`      |

---

## Security

- Passwords never stored plaintext — bcrypt only.
- JWT secret in `.env`, never committed.
- `.env` and `ecomm.db` in `.gitignore`.
- CORS restricted to `http://localhost:5173` in development.

---

## Out of Scope

- Password reset / forgot password
- Social / OAuth login
- Email verification
- Role-based access control
- Production deployment configuration
