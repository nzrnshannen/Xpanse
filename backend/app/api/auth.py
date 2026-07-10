from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import Session
from app.core.database import get_session

router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post(
    "/signup", 
    response_model=TokenResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account"
)
async def signup(
    data: UserRegisterRequest, 
    session: Session = Depends(get_session)
) -> TokenResponse:
    """
    User registration placeholder.
    In production:
    - Check if user already exists in DB
    - Hash the password using passlib/bcrypt
    - Create a new User object and save it to the DB
    - Generate and return a secure JWT token
    """
    # Simple mockup return for base structure
    return TokenResponse(
        access_token="mock_jwt_access_token_for_" + data.email,
        token_type="bearer"
    )

@router.post(
    "/login", 
    response_model=TokenResponse,
    summary="Authenticate user credentials"
)
async def login(
    data: UserLoginRequest, 
    session: Session = Depends(get_session)
) -> TokenResponse:
    """
    User login placeholder.
    In production:
    - Query user by email
    - Verify password hash matches
    - Generate and return a JWT access token
    """
    # Simple mock response
    if data.email == "error@example.com":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    return TokenResponse(
        access_token="mock_jwt_access_token_for_" + data.email,
        token_type="bearer"
    )
