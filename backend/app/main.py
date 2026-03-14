from typing import List

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app import crud
from app.config import settings
from app.data.taxonomy import CAREER_TAXONOMY
from app.database import Base, check_mongo_health, check_postgres_health, engine, get_db, mongo_db
from app.deps import get_current_user
from app.models import User
from app.schemas import (
    LearningPathIn,
    RecommendResponse,
    ResumeParseResponse,
    SkillGapIn,
    SkillGapResponse,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserProfileIn,
    UserProfileOut,
)
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.learning_resources import suggest_learning_resources
from app.services.skill_gap import skill_gap_report
from app.services.skill_normalizer import normalize_skills
from app.services.xai import role_explanation

app = FastAPI(title="AI Career Recommendation API", version="0.1.0")

TAXONOMY_SKILLS = sorted({skill for role in CAREER_TAXONOMY.values() for skill in role["skills"]})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass


@app.get("/health")
def health():
    return {
        "status": "ok",
        "postgres": "up" if check_postgres_health() else "down",
        "mongo": "up" if check_mongo_health() else "down",
    }


@app.post("/auth/register", response_model=TokenResponse)
async def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = await run_in_threadpool(hash_password, payload.password)
    crud.create_user(db, payload.name, payload.email, hashed_password)
    token = create_access_token({"sub": payload.email})
    return {"access_token": token}


@app.post("/auth/login", response_model=TokenResponse)
async def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    is_valid = bool(user) and await run_in_threadpool(verify_password, payload.password, user.hashed_password)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid email/password")

    token = create_access_token({"sub": user.email})
    return {"access_token": token}


@app.post("/parse-resume", response_model=ResumeParseResponse)
async def parse_resume_endpoint(file: UploadFile = File(...)):
    from app.services.resume_parser import parse_resume

    file_name = (file.filename or "").lower()
    if not file_name.endswith((".pdf", ".docx", ".txt")):
        raise HTTPException(status_code=400, detail="Upload .pdf, .docx, or .txt resume")

    content = await file.read()
    profile = parse_resume(content, filename=file_name)

    normalized = normalize_skills(profile["skills"], TAXONOMY_SKILLS)
    if normalized:
        profile["skills"] = normalized
    else:
        profile["skills"] = sorted({skill.strip().lower() for skill in profile["skills"] if skill and skill.strip()})[:30]
    return profile


@app.post("/recommend-careers", response_model=RecommendResponse)
def recommend_careers(payload: UserProfileIn, db: Session = Depends(get_db)):
    from app.services.recommender import hybrid_recommend

    normalized_skills = normalize_skills(payload.skills, TAXONOMY_SKILLS)
    raw_skills = sorted({skill.strip().lower() for skill in payload.skills if skill and skill.strip()})
    skills_for_recommendation = normalized_skills if normalized_skills else raw_skills

    if not skills_for_recommendation:
        raise HTTPException(
            status_code=400,
            detail=(
                "No usable skills detected from the resume. "
                "Please upload a clearer resume or add role-specific skills in the skills box."
            ),
        )

    recommendations = hybrid_recommend(
        payload.user_id,
        skills_for_recommendation,
        allow_zero_overlap=not bool(normalized_skills),
    )
    if not recommendations:
        raise HTTPException(
            status_code=400,
            detail="No genuine role match found from provided skills. Add more relevant skills and try again.",
        )

    explainability = {item["role"]: role_explanation(skills_for_recommendation, item["role"]) for item in recommendations}

    user = crud.get_user_by_email(db, payload.user_id)
    if user:
        crud.log_recommendations(db, user.id, recommendations)

    try:
        mongo_db.recommendation_history.insert_one(
            {
                "user_id": payload.user_id,
                "skills": skills_for_recommendation,
                "recommendations": recommendations,
            }
        )
    except Exception:
        pass
    return {"recommendations": recommendations, "explainability": explainability}


@app.post("/skill-gap", response_model=SkillGapResponse)
def skill_gap(payload: SkillGapIn):
    report = skill_gap_report(payload.user_skills, payload.target_role)
    return report


@app.post("/learning-path")
def learning_path(payload: LearningPathIn):
    resources = suggest_learning_resources(payload.missing_skills)
    return {"resources": resources}


@app.get("/user/profile", response_model=UserProfileOut)
def user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    recent = crud.get_recent_recommendations(db, current_user.id)
    return {
        "name": current_user.name,
        "email": current_user.email,
        "recent_recommendations": [
            {
                "role": item.role,
                "score": item.score,
                "reason": item.reason,
                "created_at": item.created_at.isoformat(),
            }
            for item in recent
        ],
    }
