"""Verify .env.example is committed and contains only a placeholder SECRET_KEY."""
import os
import subprocess

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
ENV_EXAMPLE = os.path.join(REPO_ROOT, ".env.example")


def test_env_example_exists():
    assert os.path.isfile(ENV_EXAMPLE), ".env.example must be committed to the repo"


def test_secret_key_placeholder_present():
    with open(ENV_EXAMPLE) as f:
        content = f.read()
    assert "SECRET_KEY" in content, ".env.example must contain a SECRET_KEY entry"


def test_secret_key_value_is_placeholder():
    with open(ENV_EXAMPLE) as f:
        for line in f:
            stripped = line.strip()
            if stripped.startswith("SECRET_KEY"):
                _, _, value = stripped.partition("=")
                value = value.strip().strip('"').strip("'")
                assert value.startswith("<") and value.endswith(">"), (
                    f"SECRET_KEY value '{value}' does not look like a safe placeholder"
                )
                return
    raise AssertionError("No SECRET_KEY line found in .env.example")


def test_live_dotenv_not_tracked_by_git():
    result = subprocess.run(
        ["git", "ls-files", ".env"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    assert result.stdout.strip() == "", ".env must NOT be tracked by git"
