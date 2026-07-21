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
    monkeypatch.delenv("SECRET_KEY", raising=False)
    import main as app_module
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        importlib.reload(app_module)


def test_cors_allow_origins_is_exactly_localhost_5173(monkeypatch):
    app_module = _reload_main(monkeypatch)
    found_origins = None
    for mw in app_module.app.user_middleware:
        cls = getattr(mw, "cls", None)
        kwargs = getattr(mw, "kwargs", {})
        if cls is not None and "CORS" in cls.__name__:
            found_origins = kwargs.get("allow_origins")
            break
    assert found_origins is not None, "CORSMiddleware not found in app.user_middleware"
    assert found_origins == ["http://localhost:5173"]


def test_health_check_returns_ok(monkeypatch):
    from fastapi.testclient import TestClient
    app_module = _reload_main(monkeypatch)
    client = TestClient(app_module.app)
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_preflight_allows_frontend_origin(monkeypatch):
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
    assert "evil.example.com" not in allow_origin
