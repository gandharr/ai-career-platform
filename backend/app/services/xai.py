from app.data.taxonomy import CAREER_TAXONOMY


def role_explanation(user_skills: list[str], role: str) -> dict:
    required = [s.lower() for s in CAREER_TAXONOMY.get(role, {}).get("skills", [])]
    have = {s.lower() for s in user_skills}

    matched = [s for s in required if s in have]
    missing = [s for s in required if s not in have]

    contribution = []
    for skill in matched:
        contribution.append({"feature": skill, "impact": round(1 / max(1, len(required)), 3)})

    return {
        "matched": matched,
        "missing": missing,
        "feature_importance": contribution,
    }
