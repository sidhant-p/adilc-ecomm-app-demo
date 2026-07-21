# Login Module — Canonical SDLC Spec

**Spec-ID:** SPEC-20260720-login-module  
**Date:** 2026-07-20  
**Slug:** login-module-design  
Status: Approved  
**Design Input:** [docs/superpowers/specs/2026-07-20-login-module-design.md](../../superpowers/specs/2026-07-20-login-module-design.md)

---

## Problem Statement

E-commerce applications require a secure, reliable authentication layer before any personalized or transactional features can be built. Without it, no downstream capability — cart, orders, account management — can be gated to the right user. Currently, the `adilc-ecomm-app-demo` project has no authentication at all: any visitor can hit any route, and there is no concept of identity or session. **Affected parties:** end-users who need their data protected; developers who cannot build authenticated features without this foundation; and the business, which cannot safely ship user-facing functionality until identity is established.

---

## Business Value & Priority

| Dimension | Assessment |
|-----------|-----------|
| **Impact** | High — authentication is a hard prerequisite that unblocks all downstream authenticated features (cart, orders, profiles, etc.) |
| **Effort** | Medium — well-understood stack (React + FastAPI + SQLite + JWT); no novel technical risk |
| **MoSCoW** | **Must Have** — zero authenticated features can ship without this |
| **Time sensitivity** | Immediate — every sprint after this one depends on it |

---

## Scope

### In-Scope

- User **registration** (`POST /auth/register`): collect `full_name`, `email`, `password`; bcrypt-hash the password; persist to SQLite; return HTTP 201 with safe user fields
- User **login** (`POST /auth/login`): verify credentials; issue a signed HS256 JWT (30-min expiry); return token to client
- User **logout** (`POST /auth/logout`): stateless endpoint; client discards token from `localStorage`
- **Protected dashboard stub** (`GET /auth/me` + `/dashboard` route): verify Bearer token; return current user info; serve as post-login landing page
- **ProtectedRoute** component: redirect unauthenticated users to `/login`
- **Global 401 interceptor** (axios): clear token and redirect to `/login` on any 401 response
- **Inline form error handling** for all failure modes: duplicate email (409), bad credentials (401), validation failures (400/422)
- Security hygiene: `.env` and `ecomm.db` gitignored; JWT secret never committed; CORS restricted to `http://localhost:5173`
- Monorepo layout: `frontend/` (React + Vite, port 5173) and `backend/` (FastAPI, port 8000)

### Out-of-Scope

- Password reset / forgot-password flow
- Social login or OAuth (Google, GitHub, etc.)
- Email verification on registration
- Role-based access control (RBAC) or permission scopes
- Token refresh / sliding sessions
- Production deployment, containerisation, or cloud config
- Any e-commerce feature beyond the post-login dashboard stub
- Admin or back-office interfaces

---

## User Stories

**US-01 — Registration**
As a **new shopper**, I want to create an account with my name, email, and password, so that I can access protected features of the store.

**US-02 — Login**
As a **registered shopper**, I want to log in with my email and password and receive a session token, so that I can be recognised across requests without re-entering my credentials.

**US-03 — Logout**
As an **authenticated shopper**, I want to log out from the dashboard, so that my session is terminated and my token is removed from the browser.

**US-04 — Protected route enforcement**
As a **visitor who is not logged in**, I want to be automatically redirected to the login page when I try to navigate to `/dashboard`, so that private pages are never accessible without a valid session.

**US-05 — Inline error feedback**
As a **shopper filling out auth forms**, I want to see clear inline error messages (e.g., "Email already registered", "Invalid credentials") without leaving the page, so that I can correct mistakes immediately.

---

## Acceptance Criteria

### Scenario: Successful user registration

```gherkin
Scenario: A new user registers with valid credentials
  Given the registration form is open at /register
  And no account exists for "newuser@example.com"
  When the user enters full_name "Jane Doe", email "newuser@example.com", and a password of 10 characters
  And submits the registration form
  Then the backend responds with HTTP 201
  And the response body contains "id", "email", "full_name", and "created_at"
  And the response body does NOT contain "hashed_password" or any bcrypt-prefixed string
  And the stored password in the database begins with "$2b$" and does not equal the plaintext value
  And the frontend redirects the user to /login
```

### Scenario: Duplicate email registration attempt

```gherkin
Scenario: A user attempts to register with an already-registered email
  Given an account already exists for "existing@example.com"
  And the registration form is open at /register
  When the user enters full_name "John Smith", email "existing@example.com", and a valid password
  And submits the registration form
  Then the backend responds with HTTP 409
  And the response body contains a "detail" field
  And the frontend displays an inline error message containing "already registered"
  And the browser remains on /register
  And no new user record is created in the database
```

### Scenario: Registration rejected for invalid or missing fields

```gherkin
Scenario: A user submits the registration form with a password shorter than 8 characters
  Given the registration form is open at /register
  When the user enters a password with fewer than 8 characters and valid full_name and email
  And submits the registration form
  Then the backend responds with HTTP 400 or 422
  And the response body contains a "detail" field describing the validation failure
  And the frontend displays an inline validation error message
  And the browser remains on /register

Scenario: A user submits the registration form with a missing required field
  Given the registration form is open at /register
  When the user omits the email field and submits the form
  Then the backend responds with HTTP 400 or 422
  And an inline error is displayed on the form
  And the browser remains on /register
```

### Scenario: Successful login

```gherkin
Scenario: A registered user logs in with correct credentials
  Given an account exists for "jane@example.com" with password "Secure123"
  And the login form is open at /login
  When the user enters email "jane@example.com" and password "Secure123"
  And submits the login form
  Then the backend responds with HTTP 200
  And the response body contains "access_token" and "token_type" equal to "bearer"
  And the frontend stores the access token in localStorage under the key "access_token"
  And the frontend redirects the user to /dashboard
```

### Scenario: Failed login with bad credentials

```gherkin
Scenario: A user attempts to log in with an incorrect password
  Given an account exists for "jane@example.com"
  And the login form is open at /login
  When the user enters email "jane@example.com" and an incorrect password
  And submits the login form
  Then the backend responds with HTTP 401
  And the response body contains a "detail" field without field-specific credential leakage
  And the frontend displays an inline error message "Invalid credentials"
  And no token is written to localStorage
  And the browser remains on /login

Scenario: A user attempts to log in with an unregistered email
  Given no account exists for "ghost@example.com"
  And the login form is open at /login
  When the user enters email "ghost@example.com" and any password
  And submits the login form
  Then the backend responds with HTTP 401
  And the frontend displays an inline error message "Invalid credentials"
  And no token is written to localStorage
  And the response body does not distinguish between wrong password and unknown email
```

### Scenario: Accessing the protected dashboard while authenticated

```gherkin
Scenario: An authenticated user navigates to the dashboard
  Given the user has a valid JWT stored in localStorage under "access_token"
  When the user navigates to /dashboard
  Then ProtectedRoute does NOT redirect to /login
  And the dashboard page calls GET /auth/me with the header "Authorization: Bearer <token>"
  And the backend responds with HTTP 200
  And the page displays the authenticated user's full name and email
```

### Scenario: Accessing the protected dashboard while unauthenticated

```gherkin
Scenario: An unauthenticated user navigates directly to /dashboard
  Given localStorage does NOT contain the key "access_token"
  When the user navigates to /dashboard
  Then ProtectedRoute immediately redirects the user to /login
  And GET /auth/me is NOT called
  And the dashboard content is never rendered
```

### Scenario: Logout flow

```gherkin
Scenario: An authenticated user logs out
  Given the user is on /dashboard with a valid JWT in localStorage
  When the user clicks the Logout button
  Then the frontend calls POST /auth/logout
  And "access_token" is removed from localStorage
  And the user is redirected to /login

Scenario: Navigating back to /dashboard after logout
  Given the user has just logged out and localStorage no longer contains "access_token"
  When the user navigates to /dashboard (e.g. browser back button)
  Then ProtectedRoute redirects the user to /login
  And the dashboard content is not displayed
```

### Scenario: Expired or invalid JWT handling (401 interceptor)

```gherkin
Scenario: The server returns 401 for an expired JWT while on the dashboard
  Given the user is authenticated and on /dashboard
  And the stored JWT has expired or been tampered with
  When the frontend makes any API call and the server responds with HTTP 401
  Then the Axios response interceptor fires
  And "access_token" is removed from localStorage
  And the user is redirected to /login without manual intervention

Scenario: GET /auth/me is called with a missing or tampered token
  Given no token or a tampered token is supplied in the Authorization header
  When GET /auth/me is called
  Then the backend responds with HTTP 401
  And the response body contains a "detail" field
  And the response body does NOT contain "hashed_password"

Scenario: POST /auth/logout always succeeds regardless of token presence
  Given no token is present in the request headers
  When POST /auth/logout is called
  Then the backend responds with HTTP 200
  And no server-side session is expected to be cleared (stateless)
```

---

## Technical Approach & Feasibility

### Settled Decisions

| Concern | Decision |
|---|---|
| Backend runtime | Python 3.x + FastAPI, Uvicorn on port 8000 |
| Frontend runtime | React 18 + Vite, port 5173 |
| Persistence | SQLite via SQLAlchemy ORM; `ecomm.db` gitignored |
| Password hashing | `passlib[bcrypt]` — `$2b$` hashes; plaintext never persisted |
| Token format | JWT HS256, 30-min expiry, secret from `.env` |
| Auth state | Raw JWT in `localStorage["access_token"]`; `localStorage` is a conscious trade-off for dev-only scope (not for production) |
| CORS | Restricted to `http://localhost:5173` |
| Logout | Stateless — client discards token; no server-side blocklist |

### Feasibility

**Verdict: Feasible. Low architectural risk; moderate implementation complexity.** The stack is mature, the scope is tightly bounded, and all out-of-scope concerns are explicitly excluded. One developer with Python and React experience can deliver this in approximately 2–4 days.

### Risks & Mitigations

| ID | Risk | Mitigation |
|---|---|---|
| R1 | JWT secret accidentally committed | `.gitignore` before first commit; CI secret scan |
| R2 | `ecomm.db` committed | `.gitignore` gate; verified in QA story |
| R3 | Duplicate-email race → unhandled 500 | Catch `IntegrityError` explicitly |
| R4 | CORS misconfiguration | Exact origin pinned; smoke-test in scaffolding AC |
| R5 | `localStorage` JWT survives logout | `logout` clears key; `ProtectedRoute` re-checks on every nav |
| R7 | Test DB not isolated | `TestingSessionLocal` with per-test `create_all`/`drop_all` |
| R8 | `python-jose` CVEs | Pin to latest stable; re-evaluate `PyJWT` before lockfile |

### Dependencies

**Backend:** `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `passlib[bcrypt]`, `python-jose[cryptography]`, `python-dotenv`  
**Frontend:** `react`, `react-router-dom`, `axios` + (QA only) `vitest`, `@testing-library/react`, `@playwright/test`

---

## Definition of Done

### Backend
- [ ] `POST /auth/register` returns **201** with `id`, `email`, `full_name`, `created_at`; never returns `hashed_password`
- [ ] `POST /auth/register` returns **409** on duplicate email; **400/422** on missing/malformed fields (incl. password < 8 chars)
- [ ] `POST /auth/login` returns **200** with `access_token` + `token_type: "bearer"` for valid credentials
- [ ] `POST /auth/login` returns **401** for wrong password or unknown email with no field-level leakage
- [ ] `POST /auth/logout` returns **200** in all cases (stateless)
- [ ] `GET /auth/me` returns **200** for valid Bearer token; **401** for missing, expired, or tampered token
- [ ] Passwords stored only as bcrypt hashes (`$2b$`); plaintext never persisted
- [ ] No endpoint response ever contains `hashed_password`
- [ ] `pytest` suite covers all status codes and passes with **0 failures**
- [ ] `pytest` includes security assertions: bcrypt storage check and no hash-leakage check

### Frontend
- [ ] `/register` form: successful 201 redirects to `/login`; 409 shows inline "already registered"; 400/422 shows inline error
- [ ] `/login` form: successful 200 stores `localStorage["access_token"]` and redirects to `/dashboard`; 401 shows inline "Invalid credentials"
- [ ] `/dashboard` calls `GET /auth/me` on mount and displays user name and email
- [ ] Logout clears `localStorage["access_token"]` and redirects to `/login`
- [ ] `ProtectedRoute` redirects to `/login` when `localStorage["access_token"]` absent
- [ ] Axios interceptor catches all 401 responses globally
- [ ] `vitest` suite passes with **0 failures**

### Security & Configuration
- [ ] `.env` and `ecomm.db` in `.gitignore` and NOT committed
- [ ] `.env.example` committed with a non-real `SECRET_KEY` placeholder
- [ ] CORS restricts `allow_origins` to `["http://localhost:5173"]` only

### End-to-End
- [ ] Playwright E2E: **register → login → dashboard → logout → redirect to /login** passes with 0 failures
- [ ] Post-logout back-navigation guard confirmed by E2E test

### API Contract
- [ ] All response status codes match the spec table exactly
- [ ] API contract reviewed and signed off by at least one team member other than the implementer

---

## Open Questions

| ID | Question | Owner | Blocker? |
|---|---|---|---|
| OQ-1 | Minimum password length (resolved as 8 chars in AC — ratify here) | Product/Security | Yes |
| OQ-2 | `python-jose` vs `PyJWT` | Tech Lead | No |
| OQ-3 | `localStorage` JWT storage explicitly accepted as non-production trade-off? | Product/Security | Yes |
| OQ-4 | 5xx/network-timeout errors on auth forms: inline error or silent fail? | Frontend Dev | No |
| OQ-5 | Loading spinner while `GET /auth/me` is in-flight on Dashboard? | Product | No |
