import json
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application Settings loader using Pydantic Settings.
    Automatically reads environment variables from .env if present.
    """
    PROJECT_NAME: str = "Xpanse Collaboration API"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./xpanse.db")

    # Security
    SECRET_KEY: str = Field(default="8cf2e7d7054fcfb2b73ebf1c32729a67448e91456d2ee61a6b0c2d3fbdf2db56")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS Configuration - JSON string representing allowed origins
    CORS_ORIGINS: str = '["http://localhost:3000", "http://localhost:5173"]'

    # OpenAI
    OPENAI_API_KEY: str = Field(default="")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

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
