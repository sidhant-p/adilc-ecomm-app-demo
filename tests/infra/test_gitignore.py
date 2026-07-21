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
