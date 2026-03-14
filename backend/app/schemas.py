from typing import List, Dict, Optional
from pydantic import BaseModel, EmailStr, Field


class ResumeParseResponse(BaseModel):
    name: Optional[str]
    email: Optional[str]
    skills: List[str]
    education: List[str]
    certifications: List[str]
    raw_text: str


class UserProfileIn(BaseModel):
    user_id: str
    name: Optional[str] = None
    skills: List[str]
    experience_years: int = 0


class CareerRecommendation(BaseModel):
    role: str
    confidence: float
    reason: str
    method_scores: Dict[str, float] = Field(default_factory=dict)


class RecommendResponse(BaseModel):
    recommendations: List[CareerRecommendation]
    explainability: Dict[str, Dict]


class SkillGapIn(BaseModel):
    user_skills: List[str]
    target_role: str


class SkillGapItem(BaseModel):
    skill: str
    importance: float


class SkillGapResponse(BaseModel):
    target_role: str
    missing_skills: List[SkillGapItem]


class LearningPathIn(BaseModel):
    missing_skills: List[str]


class LearningResource(BaseModel):
    skill: str
    title: str
    url: str
    provider: str


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserProfileOut(BaseModel):
    name: str
    email: EmailStr
    recent_recommendations: List[Dict]
