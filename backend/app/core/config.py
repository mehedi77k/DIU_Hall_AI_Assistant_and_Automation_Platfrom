from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DIU Hall AI Assistant and Automation Platform"
    app_env: str = "development"

    database_url: str = (
        "postgresql+psycopg://diu_user:diu_password@localhost:5432/diu_hall"
    )

    backend_cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    email_notifications_enabled: bool = False
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None
    smtp_use_tls: bool = True

    public_backend_url: str = "http://localhost:8000"
    public_frontend_url: str = "http://localhost:5173"

    # LLM / RAG generation settings
    llm_enabled: bool = True

    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-8b-instant"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"

    llm_temperature: float = 0.2
    llm_max_output_tokens: int = 500

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


settings = Settings()