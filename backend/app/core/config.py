import json
import secrets
import warnings
from typing import List
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Values that mean "not configured" (e.g. copied straight from .env.example)
PLACEHOLDER_SECRET_KEYS = {"", "change-me"}
MIN_SECRET_KEY_LENGTH = 32

class Settings(BaseSettings):
    """
    Application Settings loader using Pydantic Settings.
    Automatically reads environment variables from .env if present.
    """
    PROJECT_NAME: str = "Xpanse Collaboration API"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./xpanse.db")

    # Security (must come from the environment, never from code)
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CORS_ORIGINS: str = '["http://localhost:3000", "http://localhost:5173", "https://xpanse-beta.vercel.app"]'

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def check_secret_key(self) -> "Settings":
        """
        Refuses to start without a real SECRET_KEY in production.
        In DEBUG mode a temporary key is generated instead.
        """
        if self.SECRET_KEY not in PLACEHOLDER_SECRET_KEYS and len(self.SECRET_KEY) >= MIN_SECRET_KEY_LENGTH:
            return self
        if not self.DEBUG:
            raise ValueError(
                f"SECRET_KEY must be set to a random value of at least {MIN_SECRET_KEY_LENGTH} characters "
                "when DEBUG is off. Generate one with: openssl rand -hex 32"
            )
        warnings.warn(
            "SECRET_KEY is not set or too short; using a temporary key. "
            "Login tokens will stop working when the server restarts."
        )
        self.SECRET_KEY = secrets.token_hex(32)
        return self

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except (json.JSONDecodeError, TypeError):
            # Fallback to splitting by comma if it's not a JSON list
            if "," in self.CORS_ORIGINS:
                return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
            return [self.CORS_ORIGINS]

settings = Settings()
