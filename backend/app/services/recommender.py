from typing import Dict, List, Optional

from rapidfuzz import fuzz, process
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.data.taxonomy import CAREER_TAXONOMY


TECH_ROLE_SUBDOMAIN = {
    "Data Scientist": "data",
    "Data Analyst": "data",
    "Data Engineer": "data",
    "ML Engineer": "ml",
    "NLP Engineer": "ml",
    "Backend Developer": "backend",
    "Frontend Developer": "frontend",
    "Full Stack Developer": "fullstack",
    "DevOps Engineer": "devops",
    "Cloud Architect": "cloud",
    "Cybersecurity Analyst": "security",
    "Database Administrator": "database",
    "Mobile Developer": "mobile",
    "Embedded Systems Engineer": "embedded",
    "Game Developer": "game",
}

TECH_SUBDOMAIN_KEYWORDS = {
    "data": ["sql", "python", "statistics", "tableau", "power bi", "analytics", "data visualization"],
    "ml": ["machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "model deployment"],
    "backend": ["api", "fastapi", "django", "flask", "node.js", "microservices", "rest api"],
    "frontend": ["javascript", "typescript", "react", "html", "css", "ui design", "responsive design"],
    "fullstack": ["react", "node.js", "api", "sql", "docker", "javascript", "python"],
    "devops": ["docker", "kubernetes", "ci/cd", "terraform", "linux", "automation"],
    "cloud": ["aws", "azure", "gcp", "cloud computing", "kubernetes", "networking"],
    "security": ["network security", "ethical hacking", "penetration testing", "siem", "firewalls"],
    "database": ["sql", "mysql", "postgresql", "oracle", "database design", "nosql"],
    "mobile": ["android", "ios", "flutter", "react native", "kotlin", "swift"],
    "embedded": ["c", "c++", "microcontrollers", "embedded c", "rtos", "iot"],
    "game": ["unity", "unreal engine", "game design", "3d modeling", "c#"],
}

TECH_CERT_KEYWORDS = {
    "data": ["google data analytics", "power bi", "tableau", "ibm data science"],
    "ml": ["tensorflow", "machine learning specialization", "deep learning"],
    "backend": ["oracle java", "spring", "backend"],
    "frontend": ["react", "frontend", "ui ux"],
    "fullstack": ["full stack", "mern", "mean"],
    "devops": ["docker", "kubernetes", "devops", "jenkins"],
    "cloud": ["aws", "azure", "gcp", "cloud"],
    "security": ["ceh", "security+", "cissp", "cyber security"],
    "database": ["oracle", "postgres", "sql"],
    "mobile": ["android", "ios", "flutter"],
    "embedded": ["embedded", "iot", "arduino"],
    "game": ["unity", "unreal"],
}

TOOL_KEYWORDS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "react",
    "node.js",
    "fastapi",
    "django",
    "flask",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "tensorflow",
    "pytorch",
    "tableau",
    "power bi",
    "git",
    "linux",
    "terraform",
    "mysql",
    "postgresql",
    "mongodb",
    "redis",
    "c",
    "c++",
    "kotlin",
    "swift",
}

EXPERIENCE_ACTION_KEYWORDS = {
    "built",
    "developed",
    "designed",
    "deployed",
    "implemented",
    "optimized",
    "integrated",
    "production",
    "architecture",
    "scalable",
    "pipeline",
    "microservices",
    "automation",
}


def _normalize_user_skills(user_skills: List[str]) -> List[str]:
    return sorted({skill.strip().lower() for skill in user_skills if skill and skill.strip()})


def _normalized_ratio(score: int | float) -> float:
    return max(0.0, min(1.0, float(score) / 100.0))


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


def _best_match_ratio(term: str, values: List[str]) -> float:
    if not values:
        return 0.0
    if term in values:
        return 1.0
    match = process.extractOne(term, values, scorer=fuzz.token_set_ratio)
    if not match:
        return 0.0
    return _normalized_ratio(match[1])


def _is_tech_profile(user_skills: List[str], resume_text: str = "", certifications: Optional[List[str]] = None) -> bool:
    corpus = user_skills + [resume_text.lower()]
    if certifications:
        corpus.extend([item.lower() for item in certifications if item])
    joined = " ".join(corpus)
    keyword_hits = 0
    for keywords in TECH_SUBDOMAIN_KEYWORDS.values():
        keyword_hits += sum(1 for keyword in keywords if keyword in joined)
    return keyword_hits >= 3


def _subdomain_scores(user_skills: List[str]) -> Dict[str, float]:
    scores: Dict[str, float] = {}
    for subdomain, keywords in TECH_SUBDOMAIN_KEYWORDS.items():
        if not keywords:
            scores[subdomain] = 0.0
            continue
        total = sum(_best_match_ratio(keyword, user_skills) for keyword in keywords)
        scores[subdomain] = total / len(keywords)
    return scores


def _core_stack_signal(user_skills: List[str], role: str) -> tuple[float, List[str]]:
    required = [skill.lower() for skill in CAREER_TAXONOMY.get(role, {}).get("skills", [])]
    core = required[: min(5, len(required))]
    if not core:
        return 0.0, []

    matched = _matched_required_skills(user_skills, core, threshold=84)
    return len(matched) / len(core), matched


def _tool_project_signal(user_skills: List[str], role: str) -> float:
    required = [skill.lower() for skill in CAREER_TAXONOMY.get(role, {}).get("skills", [])]
    tool_terms = [skill for skill in required if any(token in skill for token in TOOL_KEYWORDS) or skill in TOOL_KEYWORDS]
    if not tool_terms:
        tool_terms = required
    if not tool_terms:
        return 0.0
    matched = _matched_required_skills(user_skills, tool_terms, threshold=82)
    return len(matched) / len(tool_terms)


def _experience_signal(experience_years: int, resume_text: str) -> float:
    years_score = min(1.0, max(0.0, float(experience_years)) / 6.0)
    text = (resume_text or "").lower()
    keyword_hits = sum(1 for token in EXPERIENCE_ACTION_KEYWORDS if token in text)
    keyword_score = min(1.0, keyword_hits / 6.0)
    return (0.6 * years_score) + (0.4 * keyword_score)


def _certification_signal(role: str, certifications: Optional[List[str]]) -> float:
    cert_lines = [item.lower() for item in (certifications or []) if item and item.strip()]
    if not cert_lines:
        return 0.0

    subdomain = TECH_ROLE_SUBDOMAIN.get(role)
    if not subdomain:
        return 0.0

    keywords = TECH_CERT_KEYWORDS.get(subdomain, [])
    if not keywords:
        return 0.0

    joined = " ".join(cert_lines)
    matched = sum(1 for keyword in keywords if keyword in joined)
    return min(1.0, matched / max(1, len(keywords)))


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
        required = [skill.lower() for skill in details["skills"]]
        matched = _matched_required_skills(user_skills, required)
        required_set = set(required)
        overlap = len(set(matched))
        union = len(user_set | required_set)
        boosted[role] = float(overlap / max(1, union))
    return boosted


def _build_reason(user_skills: List[str], role: str) -> str:
    required = [skill.lower() for skill in CAREER_TAXONOMY.get(role, {}).get("skills", [])]
    user_set = set(user_skills)
    core = required[: min(5, len(required))]
    matched = _matched_required_skills(user_skills, required)
    matched_core = _matched_required_skills(user_skills, core)
    missing = [skill for skill in required if skill not in user_set]
    missing_core = [skill for skill in core if skill not in {s.lower() for s in matched_core}]

    if matched:
        matched_preview = ", ".join(matched[:3])
        reason = f"Matched {len(matched)}/{len(required)} required skills"
        if matched_preview:
            reason += f": {matched_preview}"
        if missing_core:
            reason += f". Must-have missing: {', '.join(missing_core[:2])}"
        elif missing:
            reason += f". Missing: {', '.join(missing[:2])}"
        return reason

    return "No direct required-skill overlap detected; confidence kept low until more relevant skills are provided"


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
    normalized_skills = _normalize_user_skills(user_skills)
    user_skill_set = set(normalized_skills)

    if not normalized_skills:
        return []

    content = _content_scores(normalized_skills)
    collab = _collab_stub_scores(normalized_skills)
    bert = _bert_stub_scores(normalized_skills)

    tech_mode = _is_tech_profile(normalized_skills, resume_text=resume_text, certifications=certifications)
    subdomain_score_map = _subdomain_scores(normalized_skills) if tech_mode else {}

    dominant_subdomains: List[str] = []
    if subdomain_score_map:
        ranked_subdomains = sorted(subdomain_score_map.items(), key=lambda item: item[1], reverse=True)
        for name, value in ranked_subdomains[:2]:
            if value >= 0.18:
                dominant_subdomains.append(name)

    w1, w2, w3 = 0.50, 0.35, 0.15

    scored = []
    for role in CAREER_TAXONOMY.keys():
        required_skill_list = [skill.lower() for skill in CAREER_TAXONOMY[role]["skills"]]
        required_skills = set(required_skill_list)
        matched_count = len(user_skill_set & required_skills)
        direct_overlap = collab.get(role, 0.0)
        semantic_score = content.get(role, 0.0)
        fuzzy_matched_required = _matched_required_skills(normalized_skills, required_skill_list)
        fuzzy_matched_count = len(fuzzy_matched_required)
        fuzzy_overlap_ratio = fuzzy_matched_count / max(1, len(required_skill_list))

        core_signal, _ = _core_stack_signal(normalized_skills, role)
        tool_signal = _tool_project_signal(normalized_skills, role)
        exp_signal = _experience_signal(experience_years, resume_text)
        cert_signal = _certification_signal(role, certifications)

        if fuzzy_matched_count == 0:
            continue

        if fuzzy_matched_count < 2 and fuzzy_overlap_ratio < 0.22:
            continue

        if not allow_zero_overlap and matched_count == 0 and (direct_overlap < 0.22 or semantic_score < 0.20):
            continue

        if fuzzy_overlap_ratio < 0.15 and direct_overlap < 0.18 and semantic_score < 0.22:
            continue

        if tech_mode and role in TECH_ROLE_SUBDOMAIN and core_signal < 0.12 and tool_signal < 0.10 and semantic_score < 0.18:
            continue

        score = (w1 * semantic_score) + (w2 * direct_overlap) + (w3 * bert.get(role, 0.0))

        if tech_mode and role in TECH_ROLE_SUBDOMAIN:
            tech_score = (0.40 * core_signal) + (0.30 * tool_signal) + (0.20 * exp_signal) + (0.10 * cert_signal)
            score = (0.55 * score) + (0.45 * tech_score)

            role_subdomain = TECH_ROLE_SUBDOMAIN.get(role)
            if dominant_subdomains:
                if role_subdomain == dominant_subdomains[0]:
                    score += 0.08
                elif len(dominant_subdomains) > 1 and role_subdomain == dominant_subdomains[1]:
                    score += 0.04

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
                    "matched_required_count": fuzzy_matched_count,
                    "matched_required_ratio": round(fuzzy_overlap_ratio, 3),
                    "core_stack": round(core_signal, 3),
                    "tool_project": round(tool_signal, 3),
                    "experience": round(exp_signal, 3),
                    "certification": round(cert_signal, 3),
                },
            }
        )

    scored.sort(key=lambda item: item["confidence"], reverse=True)

    if not scored:
        return []

    if not allow_zero_overlap and scored[0]["confidence"] < 0.18:
        return []

    best_confidence = scored[0]["confidence"]
    strict_minimum_confidence = max(0.22, round(best_confidence * 0.60, 3))
    related_minimum_confidence = max(0.12, round(best_confidence * 0.30, 3))
    target_count = 5
    max_count = 7

    qualified = []
    related_candidates = []
    for item in scored:
        method_scores = item["method_scores"]
        confidence = item["confidence"]
        role = item["role"]

        has_strict_skill_evidence = (
            method_scores.get("matched_required_count", 0) >= 2
            or method_scores.get("collaborative", 0.0) >= 0.20
            or method_scores.get("matched_required_ratio", 0.0) >= 0.18
            or method_scores.get("core_stack", 0.0) >= 0.20
            or method_scores.get("tool_project", 0.0) >= 0.18
        )
        has_strict_semantic_evidence = (
            method_scores.get("content", 0.0) >= 0.24
            or method_scores.get("bert", 0.0) >= 0.20
        )

        if confidence >= strict_minimum_confidence and (has_strict_skill_evidence or has_strict_semantic_evidence):
            qualified.append(item)
            continue

        has_related_skill_evidence = (
            method_scores.get("matched_required_count", 0) >= 2
            or method_scores.get("collaborative", 0.0) >= 0.10
            or method_scores.get("matched_required_ratio", 0.0) >= 0.10
            or method_scores.get("core_stack", 0.0) >= 0.10
            or method_scores.get("tool_project", 0.0) >= 0.10
        )
        has_related_semantic_evidence = (
            method_scores.get("content", 0.0) >= 0.16
            or method_scores.get("bert", 0.0) >= 0.13
        )

        if confidence >= related_minimum_confidence and has_related_skill_evidence and (
            has_related_semantic_evidence or method_scores.get("matched_required_ratio", 0.0) >= 0.18
        ):
            related_candidates.append(item)

    if not qualified and related_candidates:
        qualified.append(related_candidates[0])

    if not qualified:
        return []

    existing_roles = {item["role"] for item in qualified}
    if len(qualified) < target_count:
        for candidate in related_candidates:
            if candidate["role"] in existing_roles:
                continue
            qualified.append(candidate)
            existing_roles.add(candidate["role"])
            if len(qualified) >= target_count:
                break

    qualified = qualified[:max_count]
    if top_n is not None:
        return qualified[:top_n]
    return qualified
