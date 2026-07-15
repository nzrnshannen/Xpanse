from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.core import settings, init_db
from app.api import auth_router, spaces_router, boards_router, gcs_router, notes_router

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Handles startup and shutdown lifecycles.
    Automatically generates SQLModel database tables on startup.
    """
    # Initialize DB (SQLite or PostgreSQL based on configured URI)
    init_db()
    yield

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API powering rooms, boards, and real-time collaboration updates in Xpanse.",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.DEBUG,
)

# Add CORS Middleware to enable communication with React UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under api/v1 prefix namespaces
app.include_router(auth_router, prefix="/api/v1")
app.include_router(spaces_router, prefix="/api/v1")
app.include_router(boards_router, prefix="/api/v1")
app.include_router(notes_router, prefix="/api/v1")
app.include_router(gcs_router, prefix="/api/v1")

@app.get("/", status_code=status.HTTP_200_OK)
async def root() -> dict[str, str]:
    """
    Base welcome route.
    """
    return {
        "status": "online",
        "message": "Welcome to Xpanse Collaboration API. Access API docs at /docs or /redoc."
    }
