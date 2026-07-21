"""Verify backend/requirements.txt contains the six required packages."""
import os

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
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
        lines = {line.strip().lower() for line in f if line.strip() and not line.startswith("#")}
    missing = {pkg for pkg in REQUIRED_PACKAGES if pkg.lower() not in lines}
    assert not missing, f"Missing required packages: {missing}"
