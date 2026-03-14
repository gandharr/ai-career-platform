from sqlalchemy.orm import Session

from app.models import RecommendationLog, User


def create_user(db: Session, name: str, email: str, hashed_password: str) -> User:
    user = User(name=name, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def log_recommendations(db: Session, user_id: int, recommendations: list[dict]):
    for item in recommendations:
        db.add(
            RecommendationLog(
                user_id=user_id,
                role=item["role"],
                score=item["confidence"],
                reason=item["reason"],
            )
        )
    db.commit()


def get_recent_recommendations(db: Session, user_id: int, limit: int = 10):
    return (
        db.query(RecommendationLog)
        .filter(RecommendationLog.user_id == user_id)
        .order_by(RecommendationLog.created_at.desc())
        .limit(limit)
        .all()
    )
