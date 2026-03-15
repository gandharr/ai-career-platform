from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from pymongo import MongoClient
import certifi

from app.config import settings

engine = create_engine(
    settings.postgres_url,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_timeout=15,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def build_mongo_client() -> MongoClient:
    client_options = {
        "serverSelectionTimeoutMS": 2500,
        "connectTimeoutMS": 2500,
        "socketTimeoutMS": 4000,
    }

    normalized_url = (settings.mongo_url or "").strip().lower()
    if normalized_url.startswith("mongodb+srv://") or "tls=true" in normalized_url or "ssl=true" in normalized_url:
        client_options["tlsCAFile"] = certifi.where()

    return MongoClient(settings.mongo_url, **client_options)


mongo_client = build_mongo_client()
mongo_db = mongo_client[settings.mongo_db_name]


def check_mongo_health() -> bool:
    try:
        mongo_client.admin.command("ping")
        return True
    except Exception:
        return False


def get_mongo_health_details() -> dict:
    try:
        mongo_client.admin.command("ping")
        return {"status": "up"}
    except Exception as exc:
        return {"status": "down", "detail": str(exc)}


def check_postgres_health() -> bool:
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        db.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
