from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "AI Career Recommendation API"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60
    cors_origins: str = "*"

    postgres_url: str = "postgresql://postgres:postgres@db:5432/career_db"
    mongo_url: str = "mongodb://mongo:27017"
    mongo_db_name: str = "career_platform"


settings = Settings()
