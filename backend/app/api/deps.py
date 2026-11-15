from typing import Optional
from fastapi import Depends, HTTPException, WebSocket, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.database import async_session, get_session
from app.models.domain import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def _get_user_from_token(token: str, session: AsyncSession) -> Optional[User]:
    """
    Returns the user a JWT belongs to, or None if the token is invalid,
    expired, or the user no longer exists.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None
    return await session.get(User, user_id)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session)
) -> User:
    """
    Dependency for HTTP routes that require a logged-in user.
    """
    user = await _get_user_from_token(token, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def authenticate_websocket(websocket: WebSocket) -> Optional[User]:
    """
    Authenticates a WebSocket from its ?token= query param, since browsers can't
    set headers on WebSocket connections. On failure, closes the socket and returns None.
    """
    token = websocket.query_params.get("token", "")
    # Short-lived session so an open socket doesn't hold a database connection
    async with async_session() as session:
        user = await _get_user_from_token(token, session)
    if not user:
        # Accept first: closing before accepting would hide the code from the client
        await websocket.accept()
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    return user
