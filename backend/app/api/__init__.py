from app.api.auth import router as auth_router
from app.api.spaces import router as spaces_router
from app.api.boards import router as boards_router
from app.api.gcs import router as gcs_router
from app.api.notes import router as notes_router

__all__ = [
    "auth_router",
    "spaces_router",
    "boards_router",
    "gcs_router",
    "notes_router",
]
