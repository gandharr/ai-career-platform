from typing import Dict, List, Optional

from rapidfuzz import fuzz, process
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

    vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5))
    matrix = vectorizer.fit_transform(role_docs + [user_doc])
    sims = cosine_similarity(matrix[-1], matrix[:-1])[0]

    return {role: float(score) for role, score in zip(roles, sims)}


def _matched_required_skills(user_skills: List[str], required_skills: List[str], threshold: int = 86) -> List[str]:
    if not user_skills:
        return []

    matched: List[str] = []
    for required in required_skills:
        if required in user_skills:
            matched.append(required)
            continue

        fuzzy_match = process.extractOne(required, user_skills, scorer=fuzz.token_set_ratio, score_cutoff=threshold)
        if fuzzy_match:
            matched.append(required)

    return sorted(set(matched))


def _collab_stub_scores(user_skills: List[str]) -> Dict[str, float]:
    priors = {}
    for role, details in CAREER_TAXONOMY.items():
        required = [skill.lower() for skill in details["skills"]]
        if not required:
            priors[role] = 0.0
            continue

        matched = _matched_required_skills(user_skills, required)
        priors[role] = float(len(matched) / len(required))
    return priors


def _bert_stub_scores(user_skills: List[str]) -> Dict[str, float]:
    user_set = set(user_skills)
    boosted = {}
    for role, details in CAREER_TAXONOMY.items():
        required = [s.lower() for s in details["skills"]]
        matched = _matched_required_skills(user_skills, required)
        required_set = set(required)
        overlap = len(set(matched))
        union = len(user_set | required_set)
        boosted[role] = float(overlap / max(1, union))
    return boosted


def _build_reason(user_skills: List[str], role: str) -> str:
    required = [skill.lower() for skill in CAREER_TAXONOMY.get(role, {}).get("skills", [])]
    user_set = set(user_skills)
    matched = _matched_required_skills(user_skills, required)
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
    user_skill_set = set(normalized_skills)

    if not normalized_skills:
        return []

    content = _content_scores(normalized_skills)
    collab = _collab_stub_scores(normalized_skills)
    bert = _bert_stub_scores(normalized_skills)

    w1, w2, w3 = 0.50, 0.35, 0.15

    scored = []
    for role in CAREER_TAXONOMY.keys():
        required_skills = {skill.lower() for skill in CAREER_TAXONOMY[role]["skills"]}
        matched_count = len(user_skill_set & required_skills)
        direct_overlap = collab.get(role, 0.0)
        semantic_score = content.get(role, 0.0)
        if not allow_zero_overlap and matched_count == 0 and direct_overlap < 0.18 and semantic_score < 0.15:
            continue

        score = (w1 * semantic_score) + (w2 * direct_overlap) + (w3 * bert.get(role, 0.0))
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

    if not scored:
        return []

    if not allow_zero_overlap and scored[0]["confidence"] < 0.18:
        return []

    if top_n is None:
        top_n = 5
    return scored[:top_n]
