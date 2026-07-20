# Spec: Login Module — E-Commerce Application

**Spec-ID:** SPEC-20260720-login-module  
**Date:** 2026-07-20  
**Status:** Approved  
**Repo:** adilc-ecomm-app-demo  
**Design Doc:** `docs/superpowers/specs/2026-07-20-login-module-design.md`

## Traceability — GitHub Issues

Created in `sidhant-p/adilc-ecomm-app-demo`, added to Project #3.

| Issue | Type | Title |
|-------|------|-------|
| [#1](https://github.com/sidhant-p/adilc-ecomm-app-demo/issues/1) | epic | Login Module — E-Commerce Application |
| [#2](https://github.com/sidhant-p/adilc-ecomm-app-demo/issues/2) | story | [Infra] Project scaffolding & config |
| [#3](https://github.com/sidhant-p/adilc-ecomm-app-demo/issues/3) | story | [Backend] Data layer & auth utilities |
| [#4](https://github.com/sidhant-p/adilc-ecomm-app-demo/issues/4) | story | [Backend] Auth endpoints with error handling |
| [#5](https://github.com/sidhant-p/adilc-ecomm-app-demo/issues/5) | story | [Frontend] Scaffolding & API client |
| [#6](https://github.com/sidhant-p/adilc-ecomm-app-demo/issues/6) | story | [Frontend] Auth pages |
| [#7](https://github.com/sidhant-p/adilc-ecomm-app-demo/issues/7) | story | [QA] Testing & verification |

---

## 1. Problem Statement

Anonymous visitors to the e-commerce application currently have no way to create an account or authenticate, making it impossible to personalize their experience, protect order history, or gate any member-only features. Without a foundational auth layer, every downstream feature — cart persistence, order management, profile settings — is blocked. Delivering a secure, self-contained Login Module now unblocks the entire authenticated product surface.

---

## 2. Business Value

- Enables every future authenticated feature to be built on a stable identity foundation
- Establishes security baseline (bcrypt + JWT) before any sensitive user data is stored
- Provides a reusable auth pattern (`ProtectedRoute`, axios interceptor, JWT flow) the whole frontend can adopt
- Delivers a working local dev environment the full team can iterate against immediately

**MoSCoW Priority:** Must Have — zero authenticated features can ship without this  
**Estimated Complexity:** Simple–Medium (2–3 focused days for an experienced full-stack dev; 4–5 for someone new to one side of the stack)

---

## 3. Scope

### In-Scope

- **Registration page** (`/register`): form with `full_name`, `email`, `password`; calls `POST /auth/register`; redirects to `/login` on success
- **Login page** (`/login`): form with `email`, `password`; calls `POST /auth/login`; stores JWT in `localStorage`; redirects to `/dashboard`
- **Dashboard page** (`/dashboard`): protected stub; calls `GET /auth/me` to display user info; includes Logout button
- **Logout flow**: calls `POST /auth/logout`; clears JWT from `localStorage`; redirects to `/login`
- **ProtectedRoute component**: redirects unauthenticated users to `/login`
- **Axios interceptor**: globally catches `401` responses, clears token, redirects to `/login`
- **Inline form error messages**: covers `400`/`422` (validation), `401` (bad credentials / expired token), `409` (duplicate email)
- **Backend API**: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` on FastAPI (port 8000)
- **JWT tokens**: HS256, 30-minute expiry, secret from `.env` (gitignored)
- **Password security**: bcrypt hashing via `passlib`; plaintext never persisted
- **SQLite DB** (`ecomm.db`, gitignored): `users` table with `id`, `email` (unique), `hashed_password`, `full_name`, `created_at`
- **CORS**: restricted to `http://localhost:5173` in development

### Out-of-Scope

- Password reset / forgot-password flow
- Social login / OAuth (Google, GitHub, etc.)
- Email verification on registration
- Role-based access control (RBAC) or any permission tiers
- Production deployment configuration
- Refresh token rotation or persistent sessions beyond 30 minutes
- Account management (profile edit, password change, account deletion)

---

## 4. Architecture

**Monorepo layout:**

```
adilc-ecomm-app-demo/
├── frontend/          # React + Vite (port 5173)
│   └── src/
│       ├── pages/         # LoginPage, RegisterPage, DashboardPage
│       ├── components/    # AuthForm, ProtectedRoute
│       └── api/           # axiosClient.js with JWT interceptor
└── backend/           # FastAPI (port 8000)
    ├── main.py
    ├── routers/auth.py
    ├── models.py          # SQLAlchemy User model
    ├── schemas.py         # Pydantic request/response schemas
    ├── auth.py            # JWT create/verify + bcrypt helpers
    ├── database.py        # SQLite engine + get_db dependency
    └── ecomm.db           # SQLite file (gitignored)
```

---

## 5. Backend API

| Method | Path            | Auth Required | Status Codes                   | Description                                   |
|--------|-----------------|---------------|--------------------------------|-----------------------------------------------|
| POST   | /auth/register  | No            | 201, 400/422, 409              | Create user; hash password; return `UserOut`  |
| POST   | /auth/login     | No            | 200, 401, 400/422              | Verify credentials; return JWT `access_token` |
| POST   | /auth/logout    | No            | 200                            | Stateless — client discards token             |
| GET    | /auth/me        | Yes (Bearer)  | 200, 401                       | Return current user info from token           |

**User table:** `id`, `email` (unique), `hashed_password`, `full_name`, `created_at`

**Key dependencies (`requirements.txt`):**
```
fastapi
uvicorn[standard]
sqlalchemy
passlib[bcrypt]
python-jose[cryptography]
python-dotenv
```

---

## 6. Frontend

| Route      | Page           | Description                                                        |
|------------|----------------|--------------------------------------------------------------------|
| /register  | RegisterPage   | Form → POST /auth/register → redirect to /login on 201            |
| /login     | LoginPage      | Form → POST /auth/login → store JWT in localStorage → /dashboard  |
| /dashboard | DashboardPage  | Protected. GET /auth/me on mount. Shows user info + Logout button |

**Key dependencies (`package.json`):** `react-router-dom`, `axios`

**Auth state:** Raw JWT string stored in `localStorage` under key `access_token`. No external state library needed.

---

## 7. User Stories

**US-01 — Register a new account**
> As a new visitor, I want to register with my full name, email, and password, so that I can create a personal account and access authenticated features.

**US-02 — Log in with valid credentials**
> As a registered user, I want to log in with my email and password, so that I receive a JWT and am taken directly to my dashboard.

**US-03 — See a clear error on bad credentials**
> As a registered user, I want to see an inline error message when I enter wrong credentials, so that I understand why login failed without revealing which field was wrong.

**US-04 — Access the dashboard only when authenticated**
> As an authenticated user, I want `/dashboard` to be accessible only with a valid JWT, so that my account information is protected from unauthenticated access.

**US-05 — Be automatically redirected on token expiry**
> As an authenticated user, I want to be silently redirected to `/login` when my token has expired, so that I am never left in a broken, unauthenticated state.

**US-06 — Log out and end my session**
> As an authenticated user, I want a Logout button on the dashboard, so that I can explicitly end my session and prevent others from accessing my account on a shared device.

**US-07 — Have my password stored securely**
> As a registered user, I want my password to be hashed before storage, so that my credentials are protected even if the database is compromised.

**US-08 — View my own profile information when authenticated**
> As an authenticated user, I want the dashboard to display my name and email retrieved from the API, so that I can confirm I am logged in as the correct account.

---

## 8. Gherkin Acceptance Criteria

### Feature: User Registration

```gherkin
Feature: User Registration

  Background:
    Given the backend is running on http://localhost:8000
    And the frontend is running on http://localhost:5173
    And the SQLite database has no existing user with email "newuser@example.com"

  Scenario: Successful registration redirects to login page
    Given I am on "/register"
    When I enter full_name "Jane Doe", email "newuser@example.com", password "SecurePass123!"
    And I submit the registration form
    Then the API responds with HTTP 201
    And the response body contains "id", "email", "full_name", "created_at"
    And the response body does NOT contain "hashed_password" or "password"
    And I am redirected to "/login"

  Scenario: Registration with duplicate email shows error
    Given a user with email "existing@example.com" already exists
    When I submit the registration form with email "existing@example.com"
    Then the API responds with HTTP 409
    And an inline error containing "already registered" is displayed
    And I remain on "/register"

  Scenario: Registration with missing required field shows validation error
    When I submit the registration form with an empty email field
    Then the API responds with HTTP 400 or 422
    And an inline validation error is displayed
    And I remain on "/register"

  Scenario: Password is stored as bcrypt hash, never plaintext
    Given a successful registration for "hashcheck@example.com"
    When the users table is queried directly
    Then "hashed_password" starts with "$2b$" and does not equal the plaintext password
```

### Feature: User Login

```gherkin
Feature: User Login

  Background:
    Given a registered user exists with email "jane@example.com" and password "SecurePass123!"

  Scenario: Successful login stores JWT and redirects to dashboard
    Given I am on "/login"
    When I enter email "jane@example.com" and password "SecurePass123!"
    And I submit the login form
    Then the API responds with HTTP 200
    And localStorage["access_token"] contains a valid JWT
    And I am redirected to "/dashboard"

  Scenario: Login with incorrect password shows error
    When I submit the login form with password "WrongPassword!"
    Then the API responds with HTTP 401
    And an inline error containing "Invalid credentials" is displayed
    And no token is written to localStorage
    And I remain on "/login"

  Scenario: Login with unregistered email shows error
    When I submit the login form with email "ghost@example.com"
    Then the API responds with HTTP 401
    And an inline error containing "Invalid credentials" is displayed
```

### Feature: Protected Dashboard

```gherkin
Feature: Protected Dashboard Access

  Scenario: Authenticated user can view their dashboard
    Given a valid JWT is in localStorage["access_token"]
    When I navigate to "/dashboard"
    Then GET /auth/me is called with Authorization Bearer header
    And the API responds with HTTP 200
    And the dashboard renders with the user's name and email
    And a "Logout" button is visible

  Scenario: Unauthenticated user is redirected from dashboard
    Given localStorage does NOT contain "access_token"
    When I navigate to "/dashboard"
    Then I am immediately redirected to "/login"
    And GET /auth/me is NOT called

  Scenario: Expired token triggers 401 interceptor and redirects to login
    Given an expired JWT is in localStorage["access_token"]
    When I navigate to "/dashboard"
    Then GET /auth/me returns HTTP 401
    And the axios interceptor fires: token cleared from localStorage
    And I am redirected to "/login"
```

### Feature: Logout

```gherkin
Feature: User Logout

  Background:
    Given a valid JWT is in localStorage["access_token"]
    And I am on "/dashboard"

  Scenario: Clicking Logout clears token and redirects to login
    When I click the "Logout" button
    Then POST /auth/logout is called and returns HTTP 200
    And localStorage["access_token"] is removed
    And I am redirected to "/login"

  Scenario: After logout, navigating back to dashboard redirects to login
    Given I have just logged out
    When I navigate to "/dashboard"
    Then I am redirected to "/login"
```

### Feature: Security Baseline

```gherkin
Feature: Security Baseline

  Scenario: JWT secret is not committed to the repository
    When all tracked git files are scanned for SECRET_KEY with a non-placeholder value
    Then no match is found
    And ".env" appears in ".gitignore"

  Scenario: The API never returns hashed_password
    When any call is made to POST /auth/register, POST /auth/login, or GET /auth/me
    Then the response body does not contain "hashed_password" or any bcrypt-prefixed string
```

---

## 9. Technical Approach & Risks

### Technical Approach

| Area | Decision |
|------|----------|
| Backend entrypoint | `main.py`: `FastAPI()`, register auth router with prefix `/auth`, CORS middleware for `http://localhost:5173` |
| Database | `database.py`: SQLAlchemy `create_engine` with `sqlite:///./ecomm.db`; `get_db` dependency injected into routes; `Base.metadata.create_all()` on startup |
| ORM | `models.py`: single `User` class; no Alembic needed at this scope |
| Schemas | `schemas.py`: `UserCreate`, `UserLogin`, `UserOut` (no password), `Token` |
| JWT | `python-jose`: `create_access_token` (HS256, 30-min); `get_current_user` FastAPI dependency raises 401 on invalid/expired |
| Passwords | `passlib` `CryptContext` with bcrypt; `verify_password` and `get_password_hash` helpers in `auth.py` |
| Config | `python-dotenv`; fail-fast if `SECRET_KEY` missing |
| Frontend routing | `react-router-dom` v6; `BrowserRouter` > `Routes`; protected routes via `<ProtectedRoute>` |
| Auth state | Raw JWT in `localStorage["access_token"]`; no Redux/Zustand needed |
| Axios client | `api/axiosClient.js`: single instance; request interceptor attaches Bearer header; response interceptor handles 401 globally |

### Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| R1 | JWT in `localStorage` is XSS-vulnerable | Acceptable for dev/demo scope. Document limitation; migrate to `httpOnly` cookies for production. |
| R2 | Stateless logout leaves token live for up to 30 min | Short expiry (30 min) already set. Document as known gap; token blocklisting is a future story. |
| R3 | SQLite write contention on concurrent registers | Catch `IntegrityError` broadly and return 409. Sufficient for single-dev/demo load. |
| R4 | `.env` accidentally committed | Add `.env` and `ecomm.db` to `.gitignore` **before** writing any backend code. Provide `.env.example`. |
| R5 | CORS misconfiguration blocks frontend calls | Set `allow_origins=["http://localhost:5173"]` explicitly. Test with live axios call in first backend task. |

---

## 10. Definition of Done

### Backend
- [ ] `POST /auth/register` → 201 with `id`, `email`, `full_name`, `created_at` (no password field)
- [ ] `POST /auth/register` → 409 on duplicate email
- [ ] `POST /auth/register` → 400/422 on missing or malformed fields (including password shorter than 8 characters)
- [ ] `POST /auth/login` → 200 with `access_token` and `token_type: "bearer"` for valid credentials
- [ ] `POST /auth/login` → 401 for wrong password or unregistered email
- [ ] JWT is HS256, expires in 30 minutes, encodes user identity in `sub`
- [ ] `GET /auth/me` → 200 with user fields when valid Bearer token supplied
- [ ] `GET /auth/me` → 401 when token is missing, expired, or tampered
- [ ] `POST /auth/logout` → 200 regardless of whether a token is supplied
- [ ] Passwords stored as bcrypt hashes (prefix `$2b$`); plaintext never persisted
- [ ] JWT secret read from `.env`; `.env` and `ecomm.db` in `.gitignore`
- [ ] CORS restricted to `http://localhost:5173`
- [ ] `pytest` suite passes with 0 failures

### Frontend
- [ ] `/register` renders form with `full_name`, `email`, `password`; successful submission → `/login`
- [ ] Duplicate email registration shows inline error; page does not navigate
- [ ] `/login` renders form; successful login stores JWT in `localStorage["access_token"]` → `/dashboard`
- [ ] Wrong credentials show inline error; no token stored
- [ ] `ProtectedRoute` redirects to `/login` when `localStorage["access_token"]` is absent
- [ ] `/dashboard` calls `GET /auth/me` with Bearer header; displays user name/email
- [ ] Logout button clears `localStorage["access_token"]` → `/login`
- [ ] After logout, back-navigating to `/dashboard` → redirected to `/login`
- [ ] Axios 401 interceptor clears token and redirects globally
- [ ] All form errors rendered inline; no alert/modal
- [ ] `vitest` suite passes with 0 failures

### Integration & Quality Gates
- [ ] E2E Playwright test: register → login → dashboard → logout → confirm redirect
- [ ] No `console.error` or uncaught promise rejections during E2E happy path
- [ ] API contract (status codes + response shapes) matches this spec exactly
- [ ] No partially-implemented out-of-scope features left in committed code

---

## 11. Open Questions

| # | Question | Owner |
|---|----------|-------|
| OQ-1 | JWT in `localStorage` vs `httpOnly` cookie — acceptable XSS risk for this scope? | Dev Lead |
| OQ-2 | Should expired-token redirect preserve the originally requested URL? | Dev Lead |
| OQ-3 | Is 30-min hard expiry acceptable for a shopping session? | PO + Dev Lead |
| OQ-4 | ~~Minimum password length~~ — **resolved:** minimum 8 characters enforced in `UserCreate` Pydantic schema. No special character requirement at this scope. | Dev |
| OQ-5 | SQLite for all local dev and integration tests, or migrate to PostgreSQL before next epic? | Dev Lead |
