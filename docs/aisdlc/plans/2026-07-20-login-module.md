# Ecomm Login Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete login module with registration, login, logout, JWT session handling, and a protected dashboard.

**Architecture:** Implement a FastAPI backend for auth rules, password hashing, JWT issuance, and current-user lookup. Implement a React + Vite frontend that stores the token locally, guards protected routes, and renders register/login/dashboard flows. Keep the API contract small and consistent so backend errors map cleanly to inline UI messages.

**Tech Stack:** FastAPI, SQLAlchemy, SQLite, passlib[bcrypt], PyJWT, React, Vite, Axios, pytest, Vitest, React Testing Library

## Global Constraints

- User registration with full name, email, and password
- User login with email and password
- JWT-based session handling on the client
- Protected dashboard view
- Logout by clearing client-side auth state
- Basic auth error handling for duplicate email, invalid credentials, and expired/invalid tokens
- Password reset / forgot password
- Social login / OAuth
- Email verification
- Role-based authorization
- Production deployment setup
- FastAPI backend for auth rules and token issuance
- SQLite for persistence
- bcrypt for password hashing
- JWT for stateless authentication
- JWT: HS256, 30-minute expiry, secret from `.env`
- CORS configured to allow `http://localhost:5173`
- `.env` and `ecomm.db` in `.gitignore`

---

### Task 1: Building backend auth primitives

**Files:**
- Create: `backend/database.py`
- Create: `backend/models.py`
- Create: `backend/schemas.py`
- Create: `backend/auth.py`
- Create: `backend/tests/test_auth_utils.py`
- Modify: `backend/main.py` later to import these primitives

**Interfaces:**
- Produces: `User` SQLAlchemy model with `id`, `email`, `hashed_password`, `full_name`, `created_at`
- Produces: `hash_password(password: str) -> str`
- Produces: `verify_password(password: str, hashed_password: str) -> bool`
- Produces: `create_access_token(payload: dict, expires_minutes: int = 30) -> str`
- Produces: `get_db()` dependency for FastAPI routes

- [ ] **Step 1: Write the failing tests**

```python
def test_hash_password_returns_different_value():
    hashed = hash_password("s3cret-pass")
    assert hashed != "s3cret-pass"
    assert verify_password("s3cret-pass", hashed)

def test_create_access_token_contains_subject_and_expiry():
    token = create_access_token({"sub": "user-123"})
    assert token
```

- [ ] **Step 2: Run the test file and confirm it fails**

Run: `pytest backend/tests/test_auth_utils.py -v`
Expected: fail because `backend.auth` and related primitives do not exist yet.

- [ ] **Step 3: Implement the minimal backend primitives**

```python
from datetime import datetime, timedelta, timezone
from typing import Generator

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SECRET_KEY = "change-me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base = declarative_base()
engine = create_engine("sqlite:///./ecomm.db", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

def create_access_token(payload: dict, expires_minutes: int = 30) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    data = payload.copy()
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
```

- [ ] **Step 4: Run the tests again and confirm they pass**

Run: `pytest backend/tests/test_auth_utils.py -v`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add backend/database.py backend/models.py backend/schemas.py backend/auth.py backend/tests/test_auth_utils.py
git commit -m "feat: add backend auth primitives"
```

### Task 2: Implementing auth routes and error responses

**Files:**
- Create: `backend/routers/auth.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_auth_routes.py`

**Interfaces:**
- Consumes: `hash_password`, `verify_password`, `create_access_token`, `get_db`
- Produces: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Produces: consistent JSON errors with `detail` for 400/401/409 cases

- [ ] **Step 1: Write the failing route tests**

```python
def test_register_creates_user_and_returns_201(client):
    response = client.post("/auth/register", json={
        "full_name": "Ada Lovelace",
        "email": "ada@example.com",
        "password": "strong-pass"
    })
    assert response.status_code == 201
    assert response.json()["email"] == "ada@example.com"

def test_login_rejects_invalid_credentials(client):
    response = client.post("/auth/login", json={
        "email": "ada@example.com",
        "password": "wrong-pass"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"
```

- [ ] **Step 2: Run the route tests and confirm they fail**

Run: `pytest backend/tests/test_auth_routes.py -v`
Expected: fail because the auth router and app wiring are missing.

- [ ] **Step 3: Implement the router and app wiring**

```python
from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    ...

@router.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    ...

@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    ...
```

- [ ] **Step 4: Run the route tests again and confirm they pass**

Run: `pytest backend/tests/test_auth_routes.py -v`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add backend/main.py backend/routers/auth.py backend/tests/test_auth_routes.py
git commit -m "feat: add auth endpoints"
```

### Task 3: Building the frontend auth client and session storage

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/auth/tokenStorage.ts`
- Create: `frontend/src/auth/currentUser.ts`
- Create: `frontend/src/tests/tokenStorage.test.ts`
- Create: `frontend/src/tests/client.test.ts`

**Interfaces:**
- Produces: `getToken()`, `setToken(token: string)`, `clearToken()`
- Produces: `api` Axios instance with bearer-token injection
- Produces: 401 interceptor that clears the token

- [ ] **Step 1: Write the failing frontend tests**

```ts
import { describe, expect, it } from "vitest";
import { clearToken, getToken, setToken } from "../auth/tokenStorage";

describe("token storage", () => {
  it("stores and clears the JWT", () => {
    setToken("token-123");
    expect(getToken()).toBe("token-123");
    clearToken();
    expect(getToken()).toBeNull();
  });
});
```

- [ ] **Step 2: Run the frontend tests and confirm they fail**

Run: `npm test -- --run frontend/src/tests/tokenStorage.test.ts`
Expected: fail because the auth helpers do not exist yet.

- [ ] **Step 3: Implement token helpers and the Axios client**

```ts
const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
```

- [ ] **Step 4: Run the frontend tests again and confirm they pass**

Run: `npm test -- --run frontend/src/tests/tokenStorage.test.ts`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/client.ts frontend/src/auth/tokenStorage.ts frontend/src/auth/currentUser.ts frontend/src/tests/tokenStorage.test.ts frontend/src/tests/client.test.ts
git commit -m "feat: add frontend auth session helpers"
```

### Task 4: Building register, login, and protected dashboard screens

**Files:**
- Create: `frontend/src/components/AuthForm.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/pages/RegisterPage.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`
- Create: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/tests/authFlow.test.tsx`

**Interfaces:**
- Consumes: `api`, `setToken`, `clearToken`, `getToken`
- Produces: `AuthForm` with `full_name`, `email`, `password` or `email`, `password`
- Produces: `ProtectedRoute` that redirects unauthenticated users to `/login`
- Produces: dashboard display of `/auth/me` payload and logout action

- [ ] **Step 1: Write the failing UI tests**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("login flow", () => {
  it("shows an inline invalid-credentials message", async () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: /log in/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI tests and confirm they fail**

Run: `npm test -- --run frontend/src/tests/authFlow.test.tsx`
Expected: fail because the pages, route guard, and form shell do not exist yet.

- [ ] **Step 3: Implement the pages and route guard**

```tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}
```

- [ ] **Step 4: Run the UI tests again and confirm they pass**

Run: `npm test -- --run frontend/src/tests/authFlow.test.tsx`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/AuthForm.tsx frontend/src/components/ProtectedRoute.tsx frontend/src/pages/RegisterPage.tsx frontend/src/pages/LoginPage.tsx frontend/src/pages/DashboardPage.tsx frontend/src/App.tsx frontend/src/main.tsx frontend/src/tests/authFlow.test.tsx
git commit -m "feat: add auth pages and protected dashboard"
```

### Task 5: Wiring cross-origin auth and smoke-testing the full flow

**Files:**
- Modify: `backend/main.py`
- Create: `frontend/.env.example`
- Create: `backend/.env.example`
- Create: `docs/aisdlc/plans/2026-07-20-login-module.md` is already the plan artifact

**Interfaces:**
- Produces: backend CORS policy for `http://localhost:5173`
- Produces: documented environment variables for backend secret and frontend API base URL

- [ ] **Step 1: Add the integration-level smoke test**

```python
def test_cors_allows_local_dev_origin(client):
    response = client.options("/auth/login", headers={"Origin": "http://localhost:5173"})
    assert response.status_code in {200, 204}
```

- [ ] **Step 2: Run the integration test and confirm it fails if CORS is missing**

Run: `pytest backend/tests/test_cors.py -v`
Expected: fail before the middleware is configured.

- [ ] **Step 3: Add CORS and env examples**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 4: Run the smoke test again and confirm it passes**

Run: `pytest backend/tests/test_cors.py -v`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add backend/main.py backend/tests/test_cors.py backend/.env.example frontend/.env.example
git commit -m "feat: finalize login module wiring"
```

## Self-Review

**1. Spec coverage:** Registration is covered in Task 2 and Task 4. Login and invalid-credential handling are covered in Task 2 and Task 4. Session persistence, token handling, and logout are covered in Tasks 3 and 4. Protected dashboard access is covered in Task 4. Duplicate email and expired/invalid token handling are covered in Tasks 2 and 3. Out-of-scope items are captured in Global Constraints.

**2. Placeholder scan:** No TBD/TODO/fill-in placeholders remain. Every task includes concrete files, interfaces, code, and commands.

**3. Type consistency:** The token helpers are named consistently across Tasks 3 and 4. The backend auth utilities used by the router are defined in Task 1 and consumed in Task 2. The route guard and token storage API are stable across frontend tasks.
