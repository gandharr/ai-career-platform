from math import sqrt
from typing import Dict, List, Optional, Set

from app.data.taxonomy import CAREER_TAXONOMY


DEFAULT_TOP_N = 10


def normalize_skill_list(skills: List[str]) -> List[str]:
    normalized = {
        skill.strip().lower()
        for skill in skills
        if skill and isinstance(skill, str) and skill.strip()
    }
    return sorted(normalized)


def build_career_skill_dataset() -> Dict[str, Set[str]]:
    return {
        role: {
            skill.strip().lower()
            for skill in role_data.get("skills", [])
            if isinstance(skill, str) and skill.strip()
        }
        for role, role_data in CAREER_TAXONOMY.items()
    }


def calculate_career_match_score(user_skills: Set[str], required_skills: Set[str]) -> Dict:
    if not user_skills or not required_skills:
        return {
            "score": 0.0,
            "matched_skills": [],
            "match_ratio": 0.0,
            "cosine_similarity": 0.0,
        }

    matched_skills = sorted(user_skills.intersection(required_skills))
    overlap_count = len(matched_skills)

    if overlap_count == 0:
        return {
            "score": 0.0,
            "matched_skills": [],
            "match_ratio": 0.0,
            "cosine_similarity": 0.0,
        }

    match_ratio = overlap_count / len(required_skills)
    cosine_similarity = overlap_count / sqrt(len(user_skills) * len(required_skills))
    score = (0.65 * cosine_similarity) + (0.35 * match_ratio)

    return {
        "score": round(score, 4),
        "matched_skills": matched_skills,
        "match_ratio": round(match_ratio, 4),
        "cosine_similarity": round(cosine_similarity, 4),
    }


def rank_career_recommendations(user_skills: List[str], top_n: int = DEFAULT_TOP_N) -> List[Dict]:
    normalized_skills = normalize_skill_list(user_skills)
    user_skill_set = set(normalized_skills)

    if not user_skill_set:
        return []

    career_skill_dataset = build_career_skill_dataset()

    scored_roles: List[Dict] = []
    for role, required_skills in career_skill_dataset.items():
        match_result = calculate_career_match_score(user_skill_set, required_skills)
        if match_result["score"] <= 0:
            continue

        matched_skills = match_result["matched_skills"]
        score = float(match_result["score"])
        reason = (
            f"Matched {len(matched_skills)}/{len(required_skills)} required skills: "
            f"{', '.join(matched_skills[:6])}"
        )

        scored_roles.append(
            {
                "role": role,
                "confidence": round(score, 3),
                "matching_score": round(score, 3),
                "matched_skills": matched_skills,
                "reason": reason,
                "method_scores": {
                    "cosine_similarity": match_result["cosine_similarity"],
                    "required_skill_match_ratio": match_result["match_ratio"],
                    "matched_required_count": len(matched_skills),
                },
            }
        )

    scored_roles.sort(
        key=lambda item: (
            item["confidence"],
            item["method_scores"]["matched_required_count"],
            item["role"],
        ),
        reverse=True,
    )

    return scored_roles[: max(1, top_n)]


def hybrid_recommend(
    user_id: str,
    user_skills: List[str],
    experience_years: int = 0,
    certifications: Optional[List[str]] = None,
    resume_text: str = "",
    top_n: Optional[int] = None,
    allow_zero_overlap: bool = False,
):
    _ = user_id
    _ = experience_years
    _ = certifications
    _ = resume_text
    _ = allow_zero_overlap

    limit = top_n if top_n is not None else DEFAULT_TOP_N
    return rank_career_recommendations(user_skills, top_n=limit)
