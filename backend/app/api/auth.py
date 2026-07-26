from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.models.domain import User
from app.core.security import get_password_hash, verify_password, create_access_token

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
    session: AsyncSession = Depends(get_session)
) -> TokenResponse:
    """
    Registers a new user and returns a JWT token.
    """
    # Check if user already exists
    result = await session.execute(select(User).where(User.email == data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Create new user
    new_user = User(
        name=data.name,
        email=data.email,
        hashed_password=get_password_hash(data.password)
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    # Generate token
    access_token = create_access_token(subject=new_user.id)
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.post(
    "/login", 
    response_model=TokenResponse,
    summary="Authenticate user credentials"
)
async def login(
    data: UserLoginRequest, 
    session: AsyncSession = Depends(get_session)
) -> TokenResponse:
    """
    Authenticates user credentials and returns a JWT token.
    """
    # Query user by email
    result = await session.execute(select(User).where(User.email == data.email))
    user = result.scalars().first()
    
    # Verify user exists and password is correct
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Generate token
    access_token = create_access_token(subject=user.id)
    return TokenResponse(access_token=access_token, token_type="bearer")
