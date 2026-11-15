import re
import secrets
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt
from starlette.websockets import WebSocketDisconnect

from app.core.config import settings
from app.core.security import create_access_token
from app.main import app

API = "/api/v1"
PUBLIC_ROUTES = {f"{API}/auth/signup", f"{API}/auth/login"}
WEBSOCKETS = [f"{API}/gcs/rooms/1/ws", f"{API}/spaces/1/meetings/1"]

PROTECTED_ROUTES = sorted(
    (method.upper(), re.sub(r"{[^}]+}", "1", path))
    for path, operations in app.openapi()["paths"].items()
    if path.startswith(API) and path not in PUBLIC_ROUTES
    for method in operations
)


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def bad_tokens():
    return {
        "garbage": "not-a-token",
        "expired": create_access_token(1, expires_delta=timedelta(seconds=-1)),
        "wrong_key": jwt.encode(
            {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=5)},
            secrets.token_hex(32),
            algorithm=settings.ALGORITHM,
        ),
        "non_numeric_subject": create_access_token("abc"),
        "unknown_user": create_access_token(999999),
    }


def test_route_list_covers_the_api():
    assert len(PROTECTED_ROUTES) > 20


@pytest.mark.parametrize("method,path", PROTECTED_ROUTES)
def test_protected_route_rejects_missing_token(client, method, path):
    r = client.request(method, path)
    assert r.status_code == 401, r.text
    assert r.headers["www-authenticate"] == "Bearer"


@pytest.mark.parametrize("kind", ["garbage", "expired", "wrong_key", "non_numeric_subject", "unknown_user"])
def test_protected_route_rejects_bad_token(client, kind):
    r = client.get(f"{API}/spaces/", headers=bearer(bad_tokens()[kind]))
    assert r.status_code == 401, r.text


def test_protected_route_accepts_valid_token(client, signup):
    _, _, token = signup()
    assert client.get(f"{API}/spaces/", headers=bearer(token)).status_code == 200


def test_me_returns_the_token_owner(client, signup):
    email, _, token = signup()
    r = client.get(f"{API}/auth/me", headers=bearer(token))
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["email"] == email
    assert set(body) == {"id", "name", "email"}


def test_login_token_works(client, signup):
    email, password, _ = signup()
    r = client.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    assert client.get(f"{API}/auth/me", headers=bearer(r.json()["access_token"])).json()["email"] == email


def test_login_rejects_wrong_password(client, signup):
    email, _, _ = signup()
    r = client.post(f"{API}/auth/login", json={"email": email, "password": "wrong-password"})
    assert r.status_code == 401


def test_login_rejects_unregistered_user(client):
    r = client.post(f"{API}/auth/login", json={"email": "nobody@example.com", "password": "password123"})
    assert r.status_code == 401


@pytest.mark.parametrize("path", WEBSOCKETS)
def test_websocket_rejects_missing_token(client, path):
    with client.websocket_connect(path) as ws:
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_text()
    assert exc.value.code == 1008


@pytest.mark.parametrize("path", WEBSOCKETS)
@pytest.mark.parametrize("kind", ["garbage", "expired", "wrong_key", "non_numeric_subject", "unknown_user"])
def test_websocket_rejects_bad_token(client, path, kind):
    with client.websocket_connect(f"{path}?token={bad_tokens()[kind]}") as ws:
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_text()
    assert exc.value.code == 1008


def test_chat_websocket_accepts_valid_token(client, signup):
    _, _, token = signup()
    with client.websocket_connect(f"{API}/gcs/rooms/1/ws?token={token}") as ws:
        assert '"event": "join"' in ws.receive_text()


def test_meeting_websocket_passes_auth_with_valid_token(client, signup):
    _, _, token = signup()
    # No such room, so getting past auth means the 4004 "room not found" close
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"{API}/spaces/1/meetings/1?token={token}"):
            pass
    assert exc.value.code == 4004
