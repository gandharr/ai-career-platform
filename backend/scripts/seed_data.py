import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy.orm import Session

from app.crud import create_user, get_user_by_email
from app.data.taxonomy import CAREER_TAXONOMY
from app.database import Base, engine, mongo_db
from app.services.auth import hash_password


def seed_users(db: Session):
    demo_users = [
        ("Intern Demo", "intern@example.com", "password123"),
        ("Data Student", "student@example.com", "password123"),
    ]

    for name, email, password in demo_users:
        if not get_user_by_email(db, email):
            create_user(db, name, email, hash_password(password))


def seed_mongo_collections():
    existing = mongo_db.dataset_metadata.find_one({"name": "career_taxonomy"})
    if not existing:
        mongo_db.dataset_metadata.insert_one(
            {
                "name": "career_taxonomy",
                "roles": list(CAREER_TAXONOMY.keys()),
                "total_roles": len(CAREER_TAXONOMY),
            }
        )


def main():
    Base.metadata.create_all(bind=engine)

    from app.database import SessionLocal

    db = SessionLocal()
    try:
        seed_users(db)
        seed_mongo_collections()
    finally:
        db.close()

    print("Seed complete: users + dataset metadata inserted (if missing).")


if __name__ == "__main__":
    os.environ.setdefault("SECRET_KEY", "change-me")
    main()
