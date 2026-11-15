import os
import secrets
import tempfile

# Set before the app is imported. Real environment variables win over backend/.env,
# so tests always run against a throwaway SQLite database.
_db_path = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["DEBUG"] = "False"
os.environ["SECRET_KEY"] = secrets.token_hex(32)
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

API = "/api/v1"


@pytest.fixture(scope="session")
def client():
    assert settings.DATABASE_URL.startswith("sqlite"), "Tests must never run against a real database"
    with TestClient(app) as c:
        yield c


@pytest.fixture
def signup(client):
    """Registers a new user and returns (email, password, token)."""
    def _signup():
        email = f"{secrets.token_hex(6)}@example.com"
        password = "password123"
        r = client.post(f"{API}/auth/signup", json={"name": "Test User", "email": email, "password": password})
        assert r.status_code == 201, r.text
        return email, password, r.json()["access_token"]
    return _signup
