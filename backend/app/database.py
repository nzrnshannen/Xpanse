from typing import AsyncGenerator
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings

# Use async drivers: asyncpg for PostgreSQL, aiosqlite for SQLite
db_url = settings.DATABASE_URL
if db_url.startswith(("postgresql://", "postgres://", "postgresql+psycopg2://")):
    db_url = "postgresql+asyncpg://" + db_url.split("://", 1)[1]
elif db_url.startswith("sqlite:///"):
    db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///")

engine = create_async_engine(db_url, echo=settings.DEBUG, future=True)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def init_db() -> None:
    """
    Initializes database tables defined in app.models asynchronously.
    """
    from app import models  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency generator for database sessions.
    FastAPI manages the teardown/commit cycles.
    """
    async with async_session() as session:
        yield session
