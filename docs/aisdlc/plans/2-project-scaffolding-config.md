# Implementation Plan — #2 [Infra] Project Scaffolding & Config

**Issue:** #2  
**Spec-ID:** SPEC-20260720-login-module  
**Spec Reference:** `docs/aisdlc/specs/2026-07-20-login-module-design.md` (§4 Technical Approach)  
**Branch (implement):** `feat/2-project-scaffolding-config`  
**Plan branch:** `plan/2-project-scaffolding-config`  
**Date:** 2026-07-21  

---

## 1. Summary

This ticket establishes the foundational monorepo skeleton that every subsequent ticket in the Login
Module feature depends on. Nothing functional is implemented here; the deliverables are purely
structural and config-level:

- Monorepo directory layout (`frontend/`, `backend/`) matching spec §4
- `.gitignore` that prevents secrets and the SQLite DB from ever entering the repo (Risks R1, R2)
- `backend/requirements.txt` with the exact six dependencies listed in the spec
- `.env.example` with a non-real `SECRET_KEY` placeholder (never a real value)
- `backend/main.py` bootstrapping FastAPI with CORS restricted to `http://localhost:5173`

The FastAPI app must boot on port 8000, and a live axios (or curl) preflight originating from
`http://localhost:5173` must not be blocked by CORS (AC bullet 6 / Risk R4 in spec).

No secret with a real value may be committed (Risks R1, R4 from spec risk table).

---

## 2. File Structure to Create

```
adilc-ecomm-app-demo/               ← repo root (already exists)
├── .gitignore                       ← NEW — .env, ecomm.db, Python & Node ignores
├── .env.example                     ← NEW — SECRET_KEY=<your-secret-key-here>
├── backend/                         ← NEW directory
│   ├── requirements.txt             ← NEW — six packages, one per line
│   └── main.py                      ← NEW — FastAPI app + CORSMiddleware
│   # backend/.env is NOT committed; covered by .gitignore
└── frontend/                        ← NEW empty directory (fleshed out in #5)
    └── .gitkeep                     ← keeps directory tracked without content

tests/                               ← NEW test directory (TDD-first)
└── infra/
    ├── __init__.py
    ├── test_gitignore.py            ← written BEFORE .gitignore
    ├── test_requirements.py         ← written BEFORE requirements.txt
    ├── test_env_example.py          ← written BEFORE .env.example
    └── test_main.py                 ← written BEFORE main.py
```

> **Security note:** `backend/.env` is created locally at runtime (copied from `.env.example`).
> It must never be staged or committed. A test will assert this via `git ls-files`.

---

## 3. Ordered Implementation Tasks

### Task 0 — Dependency gate

```bash
node scripts/check-deps.mjs --issue 2
```

Issue #2 declares **no dependencies**. Expected exit code: `0`. Stop immediately on non-zero.

---

### Task 1 — Create and switch to the feature branch

```bash
git checkout master
git pull origin master
git checkout -b feat/2-project-scaffolding-config
```

---

### Task 2 — Write `.gitignore` FIRST (TDD: test → fail → implement → pass)

**Why first:** `.gitignore` must exist before any Python or Node files land so that `.env` and
`ecomm.db` can never be accidentally staged.

#### 2a. Write the failing test

```python
# tests/infra/test_gitignore.py
"""Verify .gitignore protects secrets and the SQLite DB."""
import subprocess
import os

REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


def _is_ignored(path: str) -> bool:
    result = subprocess.run(
        ["git", "check-ignore", "-q", path],
        cwd=REPO_ROOT,
        capture_output=True,
    )
    return result.returncode == 0


def test_dotenv_is_ignored():
    assert _is_ignored(".env"), ".env must be listed in .gitignore"


def test_ecomm_db_is_ignored():
    assert _is_ignored("ecomm.db"), "ecomm.db must be listed in .gitignore"


def test_backend_dotenv_is_ignored():
    assert _is_ignored("backend/.env"), "backend/.env must be covered by .gitignore"
```

Run `pytest tests/infra/test_gitignore.py` → **3 FAILED** (expected).

#### 2b. Create `.gitignore`

```gitignore
# =========================================================
# SECRETS & LOCAL DATABASE — MUST remain at the top
# =========================================================
.env
ecomm.db

# =========================================================
# Python
# =========================================================
__pycache__/
*.py[cod]
*.pyo
*.pyd
.Python
env/
venv/
.venv/
*.egg-info/
dist/
build/
.pytest_cache/
*.log
htmlcov/
.coverage
.mypy_cache/

# =========================================================
# Node / Frontend
# =========================================================
node_modules/
dist/
.DS_Store
*.local

# =========================================================
# IDE / OS
# =========================================================
.idea/
.vscode/
*.iml
Thumbs.db
```

Run `pytest tests/infra/test_gitignore.py` → **3 PASSED**.

#### 2c. Commit (test file first, then implementation)

```bash
git add tests/infra/__init__.py tests/infra/test_gitignore.py
git commit -m "test(infra): add gitignore assertions (#2)"

git add .gitignore
git commit -m "chore: add .gitignore protecting .env and ecomm.db (#2)"
```

---

### Task 3 — Scaffold directory skeleton

```bash
mkdir -p backend frontend
touch frontend/.gitkeep
git add frontend/.gitkeep
git commit -m "chore: scaffold backend/ and frontend/ directories (#2)"
```

---

### Task 4 — `backend/requirements.txt` (TDD: test → fail → implement → pass)

#### 4a. Write the failing test

```python
# tests/infra/test_requirements.py
"""Verify backend/requirements.txt contains the six required packages."""
import os

REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
REQS = os.path.join(REPO_ROOT, "backend", "requirements.txt")

REQUIRED_PACKAGES = {
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy",
    "passlib[bcrypt]",
    "python-jose[cryptography]",
    "python-dotenv",
}


def test_requirements_file_exists():
    assert os.path.isfile(REQS), "backend/requirements.txt must exist"


def test_all_required_packages_present():
    with open(REQS) as f:
        lines = {
            line.strip().lower()
            for line in f
            if line.strip() and not line.startswith("#")
        }
    missing = {pkg for pkg in REQUIRED_PACKAGES if pkg.lower() not in lines}
    assert not missing, f"Missing required packages: {missing}"
```

Run `pytest tests/infra/test_requirements.py` → **FAILED**.

#### 4b. Create `backend/requirements.txt`

```
fastapi
uvicorn[standard]
sqlalchemy
passlib[bcrypt]
python-jose[cryptography]
python-dotenv
```

Run `pytest tests/infra/test_requirements.py` → **2 PASSED**.

#### 4c. Commit

```bash
git add tests/infra/test_requirements.py
git commit -m "test(infra): add requirements.txt assertions (#2)"

git add backend/requirements.txt
git commit -m "chore: add backend/requirements.txt with six dependencies (#2)"
```

---

### Task 5 — `.env.example` (TDD: test → fail → implement → pass)

#### 5a. Write the failing test

```python
# tests/infra/test_env_example.py
"""Verify .env.example is committed and contains only a placeholder SECRET_KEY."""
import os
import subprocess

REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
ENV_EXAMPLE = os.path.join(REPO_ROOT, ".env.example")


def test_env_example_exists():
    assert os.path.isfile(ENV_EXAMPLE), ".env.example must be committed to the repo"


def test_secret_key_placeholder_present():
    with open(ENV_EXAMPLE) as f:
        content = f.read()
    assert "SECRET_KEY" in content, ".env.example must contain a SECRET_KEY entry"


def test_secret_key_value_is_placeholder():
    """The SECRET_KEY value must be a clearly non-real placeholder."""
    with open(ENV_EXAMPLE) as f:
        for line in f:
            stripped = line.strip()
            if stripped.startswith("SECRET_KEY"):
                _, _, value = stripped.partition("=")
                value = value.strip().strip('"').strip("'")
                assert value.startswith("<") and value.endswith(">"), (
                    f"SECRET_KEY value '{value}' does not look like a safe placeholder "
                    "(expected angle-bracket format, e.g. <your-secret-key-here>)"
                )
                return
    raise AssertionError("No SECRET_KEY line found in .env.example")


def test_live_dotenv_not_tracked_by_git():
    """The live .env must not be tracked by git (even if it exists locally)."""
    result = subprocess.run(
        ["git", "ls-files", ".env"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    assert result.stdout.strip() == "", (
        ".env must NOT be tracked by git — remove it and check .gitignore"
    )
```

Run `pytest tests/infra/test_env_example.py` → **FAILED**.

#### 5b. Create `.env.example`

```dotenv
# Copy this file to .env and fill in real values before running the server.
# NEVER commit .env to the repository.

SECRET_KEY=<your-secret-key-here>
```

Run `pytest tests/infra/test_env_example.py` → **4 PASSED**.

#### 5c. Commit

```bash
git add tests/infra/test_env_example.py
git commit -m "test(infra): add .env.example assertions (#2)"

git add .env.example
git commit -m "chore: add .env.example with SECRET_KEY placeholder (#2)"
```

---

### Task 6 — `backend/main.py` (TDD: test → fail → implement → pass)

#### 6a. Write the failing test

```python
# tests/infra/test_main.py
"""
Verify FastAPI app configuration:
  - CORSMiddleware restricts allow_origins to ['http://localhost:5173']
  - RuntimeError is raised when SECRET_KEY env var is absent
  - GET / health-check returns {"status": "ok"}
"""
import os
import sys
import importlib
import pytest

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "backend")
)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def _reload_main(monkeypatch, secret_key="test-only-secret"):
    if secret_key is None:
        monkeypatch.delenv("SECRET_KEY", raising=False)
    else:
        monkeypatch.setenv("SECRET_KEY", secret_key)
    import main as app_module
    return importlib.reload(app_module)


def test_missing_secret_key_raises_runtime_error(monkeypatch):
    """App must raise RuntimeError at import time when SECRET_KEY is not set."""
    monkeypatch.delenv("SECRET_KEY", raising=False)
    import main as app_module
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        importlib.reload(app_module)


def test_cors_allow_origins_is_exactly_localhost_5173(monkeypatch):
    """CORSMiddleware allow_origins must be exactly ['http://localhost:5173']."""
    app_module = _reload_main(monkeypatch)
    found_origins = None
    for mw in app_module.app.user_middleware:
        cls = getattr(mw, "cls", None)
        kwargs = getattr(mw, "kwargs", {})
        if cls is not None and "CORS" in cls.__name__:
            found_origins = kwargs.get("allow_origins")
            break
    assert found_origins is not None, "CORSMiddleware not found in app.user_middleware"
    assert found_origins == ["http://localhost:5173"], (
        f"Expected allow_origins=['http://localhost:5173'], got {found_origins}"
    )


def test_health_check_returns_ok(monkeypatch):
    """GET / should return HTTP 200 with body {'status': 'ok'}."""
    from fastapi.testclient import TestClient
    app_module = _reload_main(monkeypatch)
    client = TestClient(app_module.app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_preflight_allows_frontend_origin(monkeypatch):
    """OPTIONS preflight from http://localhost:5173 must be granted."""
    from fastapi.testclient import TestClient
    app_module = _reload_main(monkeypatch)
    client = TestClient(app_module.app)
    response = client.options(
        "/",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code in (200, 204)
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_preflight_blocks_other_origins(monkeypatch):
    """OPTIONS preflight from an unlisted origin must NOT return an allow header."""
    from fastapi.testclient import TestClient
    app_module = _reload_main(monkeypatch)
    client = TestClient(app_module.app)
    response = client.options(
        "/",
        headers={
            "Origin": "http://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    allow_origin = response.headers.get("access-control-allow-origin", "")
    assert "evil.example.com" not in allow_origin, (
        "CORS must not allow origins outside the whitelist"
    )
```

Run `pytest tests/infra/test_main.py` → **FAILED** (module not found).

#### 6b. Create `backend/main.py`

```python
# backend/main.py
"""
FastAPI application factory.

Boots the adilc-ecomm-app backend on port 8000.
CORS is restricted to the Vite dev-server origin (http://localhost:5173).
Fails fast at startup if SECRET_KEY is not set in the environment.
"""
import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env when present; silently no-ops in CI where vars are injected directly.
load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Copy .env.example to .env and set a real secret value before starting the server."
    )

app = FastAPI(title="adilc-ecomm-app", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],   # exact origin only; never "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict:
    """Liveness probe — confirms the server is running."""
    return {"status": "ok"}
```

Run `pytest tests/infra/test_main.py` → **5 PASSED**.

#### 6c. Commit

```bash
git add tests/infra/test_main.py
git commit -m "test(infra): add FastAPI CORS and startup assertions (#2)"

git add backend/main.py
git commit -m "feat(backend): bootstrap FastAPI app with CORSMiddleware (#2)"
```

---

### Task 7 — Full test suite pass

```bash
pip install fastapi uvicorn[standard] sqlalchemy passlib[bcrypt] \
            python-jose[cryptography] python-dotenv httpx pytest

SECRET_KEY=test-only-secret pytest tests/infra/ -v
```

Expected: **all tests green, 0 failures**.

---

### Task 8 — Live CORS smoke-test (manual verification)

This verifies AC bullet 6: a real FastAPI server responds correctly to a preflight from the
frontend origin.

```bash
# Terminal A — start the server
cd backend
SECRET_KEY=dev-local-smoke-test uvicorn main:app --reload --port 8000
```

```bash
# Terminal B — positive check: frontend origin allowed
curl -v \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  http://localhost:8000/
# Expected: access-control-allow-origin: http://localhost:5173

# Negative check: unlisted origin must be blocked
curl -v \
  -H "Origin: http://attacker.example.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  http://localhost:8000/
# Expected: NO access-control-allow-origin header
```

---

### Task 9 — Push branch and open Dev PR

```bash
git push -u origin feat/2-project-scaffolding-config

gh pr create \
  --repo sidhant-p/adilc-ecomm-app-demo \
  --title "feat: project scaffolding & config" \
  --head feat/2-project-scaffolding-config \
  --base master \
  --body "Closes #2

## Summary
Implements the foundational monorepo skeleton per SPEC-20260720-login-module §4."
```

---

### Task 10 — Record audit entry

```bash
node scripts/audit-helpers.mjs record \
  --spec SPEC-20260720-login-module \
  --stage develop \
  --agent developer-agent \
  --status passed \
  --issue 2 \
  --branch feat/2-project-scaffolding-config \
  --pr <PR_NUMBER> \
  --commit <FINAL_SHA>
```

---

## 4. Edge Cases & Risks

| Risk ID | Risk | Mitigation in this ticket |
|---------|------|--------------------------|
| **R1** | Real `SECRET_KEY` committed | `.gitignore` is the **very first** committed file; `.env.example` uses angle-bracket placeholder; `test_live_dotenv_not_tracked_by_git` asserts `.env` absent from index |
| **R2** | `ecomm.db` committed | `.gitignore` entry `ecomm.db`; `test_ecomm_db_is_ignored` verifies via `git check-ignore` |
| **R4** | CORS misconfiguration allows arbitrary origins | `allow_origins` is a hard-coded list, never `"*"`; two CORS tests (positive + negative) |
| **R5** | FastAPI boots without `SECRET_KEY` (silent misconfiguration) | `raise RuntimeError(...)` at module scope; `test_missing_secret_key_raises_runtime_error` covers it |
| **Order of ops** | `.gitignore` committed after Python files | Task 2 is ordered first; each TDD commit sequence keeps the ignore file atomic |
| **Scope creep** | Auth endpoints, DB models, frontend code added here | `main.py` contains only app factory + CORS + health check — nothing else |
| **High-entropy placeholder** | Real hex secret in `.env.example` | `test_secret_key_value_is_placeholder` asserts value starts with `<` and ends with `>` |

---

## 5. Verification Checklist (AC → Test Mapping)

| Acceptance Criterion | Automated Test | Manual Check |
|----------------------|---------------|--------------|
| Monorepo layout `frontend/` and `backend/` created | — | `git ls-files \| grep -E "^(frontend\|backend)/"` |
| `.gitignore` includes `.env`, `ecomm.db`, Python/Node ignores | `test_gitignore.py` (3 assertions) | `git check-ignore -v .env ecomm.db` |
| `backend/requirements.txt` lists all 6 packages | `test_requirements.py` (2 assertions) | `pip install -r backend/requirements.txt` exits 0 |
| `.env.example` with placeholder `SECRET_KEY` | `test_env_example.py` (4 assertions) | `cat .env.example` shows `SECRET_KEY=<...>` |
| CORS restricted to `["http://localhost:5173"]` | `test_main.py` — 3 CORS assertions | — |
| FastAPI boots port 8000; live call not blocked by CORS | `test_main.py::test_cors_preflight_allows_frontend_origin` | Task 8 `curl` smoke-test |
| No real secret committed | `test_env_example.py` × 2 assertions | `git log --all -p -- .env` → empty |

---

## 6. Out-of-Scope (do NOT implement in this ticket)

| Item | Ticket |
|------|--------|
| Database models, `Base.metadata.create_all`, `ecomm.db` creation | #3 |
| Auth router (`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/me`) | #3, #4 |
| React/Vite setup, `package.json`, `vite.config.ts` | #5 |
| Login/Register/Dashboard UI components | #6 |
| Playwright E2E tests | #7 |

---

## 7. Definition of Done (ticket-scoped)

- [ ] `plan/2-project-scaffolding-config` Plan PR merged ← **current phase gate**
- [ ] `feat/2-project-scaffolding-config` branch created from `master` (post plan merge)
- [ ] **TDD commit order maintained:** each test file committed before its implementation
- [ ] `tests/infra/test_gitignore.py` → 3 PASSED
- [ ] `tests/infra/test_requirements.py` → 2 PASSED
- [ ] `tests/infra/test_env_example.py` → 4 PASSED
- [ ] `tests/infra/test_main.py` → 5 PASSED
- [ ] `pytest tests/infra/ -v` → **0 failures total**
- [ ] `.env` absent from `git ls-files` output
- [ ] `curl` CORS preflight smoke-test passes (Task 8)
- [ ] Dev PR body contains `Closes #2`
- [ ] Audit record written via `audit-helpers.mjs`
