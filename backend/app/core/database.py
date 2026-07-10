from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Configure connection args specifically for SQLite thread safety if needed
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create SQLModel engine instance
engine = create_engine(
    settings.DATABASE_URL, 
    echo=settings.DEBUG, 
    connect_args=connect_args
)

def init_db() -> None:
    """
    Initializes database tables defined in app.models.
    """
    # Import all models to ensure they are registered with SQLModel metadata
    from app import models  # noqa
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """
    Dependency generator for database sessions.
    FastAPI manages the teardown/commit cycles.
    """
    with Session(engine) as session:
        yield session
