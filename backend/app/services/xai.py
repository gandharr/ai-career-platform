from app.data.taxonomy import CAREER_TAXONOMY
from rapidfuzz import fuzz, process


def _normalize_skills(values: list[str]) -> list[str]:
    normalized: list[str] = []
    seen = set()
    for value in values:
        if not isinstance(value, str):
            continue
        cleaned = value.strip().lower()
        if not cleaned:
            continue
        if cleaned in seen:
            continue
        seen.add(cleaned)
        normalized.append(cleaned)
    return normalized


def _is_noisy_skill(value: str) -> bool:
    compact = "".join(ch for ch in value if ch.isalnum())
    if not compact:
        return True
    return compact.isdigit()


def _fuzzy_match_required(user_skills: list[str], required_skills: list[str], threshold: int = 84) -> list[str]:
    if not user_skills or not required_skills:
        return []

    matched: list[str] = []
    for required in required_skills:
        if required in user_skills:
            matched.append(required)
            continue

        best = process.extractOne(required, user_skills, scorer=fuzz.token_set_ratio, score_cutoff=threshold)
        if best:
            matched.append(required)

    return matched


def role_explanation(user_skills: list[str], role: str) -> dict:
    required_raw = CAREER_TAXONOMY.get(role, {}).get("skills", [])
    required = _normalize_skills(required_raw)
    have = _normalize_skills(user_skills)

    matched = _fuzzy_match_required(have, required, threshold=84)
    matched_set = set(matched)
    missing = [skill for skill in required if skill not in matched_set]

    matched = [skill for skill in matched if not _is_noisy_skill(skill)]
    missing = [skill for skill in missing if not _is_noisy_skill(skill)]

    contribution = []
    for skill in matched:
        contribution.append({"feature": skill, "impact": round(1 / max(1, len(required)), 3)})

    return {
        "matched": matched,
        "missing": missing,
        "feature_importance": contribution,
    }
