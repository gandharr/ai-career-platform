from typing import Dict, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.data.taxonomy import CAREER_TAXONOMY


def _normalize_user_skills(user_skills: List[str]) -> List[str]:
    return sorted({skill.strip().lower() for skill in user_skills if skill and skill.strip()})


def _content_scores(user_skills: List[str]) -> Dict[str, float]:
    roles = list(CAREER_TAXONOMY.keys())
    role_docs = [" ".join(CAREER_TAXONOMY[role]["skills"]) for role in roles]
    user_doc = " ".join(user_skills)

    if not user_doc.strip():
        return {role: 0.0 for role in roles}

    vectorizer = TfidfVectorizer()
    matrix = vectorizer.fit_transform(role_docs + [user_doc])
    sims = cosine_similarity(matrix[-1], matrix[:-1])[0]

    return {role: float(score) for role, score in zip(roles, sims)}


def _collab_stub_scores(user_skills: List[str]) -> Dict[str, float]:
    user_set = set(user_skills)
    priors = {}
    for role, details in CAREER_TAXONOMY.items():
        required = {skill.lower() for skill in details["skills"]}
        if not required:
            priors[role] = 0.0
            continue
        coverage = len(user_set & required) / len(required)
        priors[role] = float(coverage)
    return priors


def _bert_stub_scores(user_skills: List[str]) -> Dict[str, float]:
    user_set = {s.lower() for s in user_skills}
    boosted = {}
    for role, details in CAREER_TAXONOMY.items():
        required = {s.lower() for s in details["skills"]}
        overlap = len(user_set & required)
        union = len(user_set | required)
        boosted[role] = float(overlap / max(1, union))
    return boosted


def _build_reason(user_skills: List[str], role: str) -> str:
    required = [skill.lower() for skill in CAREER_TAXONOMY.get(role, {}).get("skills", [])]
    user_set = set(user_skills)
    matched = [skill for skill in required if skill in user_set]
    missing = [skill for skill in required if skill not in user_set]

    if matched:
        matched_preview = ", ".join(matched[:3])
        reason = f"Matched {len(matched)}/{len(required)} required skills"
        if matched_preview:
            reason += f": {matched_preview}"
        if missing:
            reason += f". Missing: {', '.join(missing[:2])}"
        return reason

    return "No direct required-skill overlap detected; confidence kept low until more relevant skills are provided"


def hybrid_recommend(
    user_id: str,
    user_skills: List[str],
    top_n: Optional[int] = None,
    allow_zero_overlap: bool = False,
):
    _ = user_id
    normalized_skills = _normalize_user_skills(user_skills)

    content = _content_scores(normalized_skills)
    collab = _collab_stub_scores(normalized_skills)
    bert = _bert_stub_scores(normalized_skills)

    w1, w2, w3 = 0.55, 0.30, 0.15

    scored = []
    for role in CAREER_TAXONOMY.keys():
        direct_overlap = collab.get(role, 0.0)
        if not allow_zero_overlap and direct_overlap <= 0.0:
            continue

        score = (w1 * content.get(role, 0.0)) + (w2 * direct_overlap) + (w3 * bert.get(role, 0.0))
        reason = _build_reason(normalized_skills, role)

        scored.append(
            {
                "role": role,
                "confidence": round(float(score), 3),
                "reason": reason,
                "method_scores": {
                    "content": round(content.get(role, 0.0), 3),
                    "collaborative": round(direct_overlap, 3),
                    "bert": round(bert.get(role, 0.0), 3),
                },
            }
        )

    scored.sort(key=lambda item: item["confidence"], reverse=True)

    if top_n is not None:
        return scored[:top_n]
    return scored
