import re
from typing import Dict, List, Optional, Tuple

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

SECTION_WEIGHT_RULES = {
    "technical skills": 5.0,
    "skills": 4.0,
    "core skills": 4.0,
    "projects": 4.0,
    "experience": 3.0,
    "professional experience": 3.0,
    "work experience": 3.0,
    "employment": 3.0,
    "education": 2.0,
    "certifications": 3.5,
    "licenses": 3.0,
    "publications": 2.5,
    "research": 3.0,
    "teaching": 3.0,
    "exhibitions": 5.0,
    "gallery": 5.0,
    "studio": 5.0,
    "awards": 2.0,
    "workshops": 1.0,
    "other experience": 1.0,
    "hobbies": 0.5,
}

DOMAIN_ANCHORS = {
    "technology": [
        "software",
        "programming",
        "developer",
        "backend",
        "frontend",
        "devops",
        "cloud",
        "api",
        "database",
        "git",
        "kubernetes",
    ],
    "data_ai": [
        "data science",
        "machine learning",
        "deep learning",
        "nlp",
        "statistics",
        "analytics",
        "data engineering",
        "etl",
        "model deployment",
        "tableau",
    ],
    "business": [
        "business analysis",
        "product management",
        "stakeholder",
        "market research",
        "operations",
        "supply chain",
        "strategy",
        "consulting",
        "kpi",
        "budgeting",
    ],
    "finance": [
        "financial modeling",
        "valuation",
        "accounting",
        "investment",
        "risk analysis",
        "audit",
        "financial planning",
    ],
    "healthcare": [
        "clinical",
        "pharmacology",
        "hospital",
        "patient care",
        "medical",
        "biomedical",
        "drug",
        "public health",
        "regulatory",
        "gmp",
    ],
    "design_creative": [
        "ui design",
        "ux",
        "figma",
        "branding",
        "illustration",
        "video editing",
        "content creation",
        "storytelling",
        "visual design",
        "adobe",
    ],
    "arts_humanities": [
        "fine art",
        "painting",
        "sculpture",
        "gallery",
        "studio",
        "exhibition",
        "art history",
        "journalism",
        "copywriting",
        "public relations",
    ],
    "engineering_core": [
        "autocad",
        "solidworks",
        "circuit design",
        "mechanical",
        "electrical",
        "civil",
        "structural",
        "manufacturing",
        "robotics",
        "embedded",
        "telecommunications",
    ],
}

CERT_TECH_WHITELIST = {
    "aws",
    "azure",
    "gcp",
    "oracle java",
    "java",
    "docker",
    "kubernetes",
    "tensorflow",
    "pytorch",
    "google data analytics",
    "tableau",
    "power bi",
}

DEGREE_NON_STEM_MARKERS = {
    "arts",
    "humanities",
    "fine arts",
    "bfa",
    "mfa",
    "literature",
    "history",
    "philosophy",
    "journalism",
}

ROLES = list(CAREER_TAXONOMY.keys())
ROLE_REQUIRED_SKILLS = {
    role: [skill.lower() for skill in details.get("skills", [])]
    for role, details in CAREER_TAXONOMY.items()
}
ROLE_REQUIRED_SKILL_SETS = {role: set(skills) for role, skills in ROLE_REQUIRED_SKILLS.items()}
ROLE_DOCS = [" ".join(ROLE_REQUIRED_SKILLS[role]) for role in ROLES]
CONTENT_VECTORIZER = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5))
ROLE_DOC_MATRIX = CONTENT_VECTORIZER.fit_transform(ROLE_DOCS)


def _normalize_user_skills(user_skills: List[str]) -> List[str]:
    return sorted({skill.strip().lower() for skill in user_skills if skill and skill.strip()})


def _split_resume_sections(resume_text: str) -> List[Tuple[str, str]]:
    text = (resume_text or "").replace("\r", "")
    if not text.strip():
        return []

    lines = [line.strip() for line in text.split("\n")]
    sections: List[Tuple[str, str]] = []
    current_header = "general"
    buffer: List[str] = []

    header_pattern = re.compile(r"^[A-Za-z][A-Za-z\s/&-]{1,40}:?$")

    def flush() -> None:
        nonlocal buffer
        chunk = " ".join(item for item in buffer if item).strip()
        if chunk:
            sections.append((current_header, chunk))
        buffer = []

    for line in lines:
        if not line:
            continue

        line_norm = line.lower().strip(": ")
        is_header = bool(header_pattern.match(line)) and len(line.split()) <= 5

        if is_header:
            flush()
            current_header = line_norm
            continue

        buffer.append(line)

    flush()

    if not sections:
        return [("general", text.lower())]

    return [(header, content.lower()) for header, content in sections]


def _header_weight(header: str) -> float:
    h = (header or "").lower()
    for token, weight in SECTION_WEIGHT_RULES.items():
        if token in h:
            return weight
    return 1.0


def _section_weighted_role_overlap(required_skills: List[str], resume_text: str) -> float:
    if not required_skills:
        return 0.0

    sections = _split_resume_sections(resume_text)
    if not sections:
        return 0.0

    weighted_hits = 0.0
    total_weight = 0.0
    for required in required_skills:
        best_weight = 0.0
        for header, content in sections:
            if required in content:
                best_weight = max(best_weight, _header_weight(header))
        weighted_hits += best_weight
        total_weight += 5.0

    if total_weight <= 0:
        return 0.0
    return min(1.0, weighted_hits / total_weight)


def _domain_anchor_scores(user_skills: List[str], resume_text: str, certifications: Optional[List[str]] = None) -> Dict[str, float]:
    sections = _split_resume_sections(resume_text)
    cert_blob = " ".join((item or "").lower() for item in (certifications or []) if item)
    skill_blob = " ".join(user_skills)

    scores: Dict[str, float] = {domain: 0.0 for domain in DOMAIN_ANCHORS}
    for domain, anchors in DOMAIN_ANCHORS.items():
        weighted_hits = 0.0
        denom = max(1.0, float(len(anchors)))

        for anchor in anchors:
            anchor_hit = 0.0
            if anchor in skill_blob:
                anchor_hit = max(anchor_hit, 2.4)
            if anchor in cert_blob:
                anchor_hit = max(anchor_hit, 2.2)

            for header, content in sections:
                if anchor in content:
                    anchor_hit = max(anchor_hit, _header_weight(header))

            weighted_hits += anchor_hit

        scores[domain] = round(min(1.0, weighted_hits / (denom * 2.2)), 4)

    return scores


def _dominant_domains(domain_scores: Dict[str, float]) -> List[str]:
    ranked = sorted(domain_scores.items(), key=lambda item: item[1], reverse=True)
    if not ranked or ranked[0][1] < 0.2:
        return []

    top_score = ranked[0][1]
    selected = []
    for domain, score in ranked:
        if score >= max(0.18, top_score * 0.65):
            selected.append(domain)
        if len(selected) >= 2:
            break
    return selected


def _role_domain_scores(role: str) -> Dict[str, float]:
    role_text = f"{role.lower()} {' '.join(ROLE_REQUIRED_SKILLS.get(role, []))}"
    scores: Dict[str, float] = {}
    for domain, anchors in DOMAIN_ANCHORS.items():
        hits = sum(1 for token in anchors if token in role_text)
        scores[domain] = hits / max(1, len(anchors))
    return scores


def _role_dominant_domains(role: str) -> List[str]:
    scores = _role_domain_scores(role)
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    if not ranked or ranked[0][1] <= 0.0:
        return []
    top = ranked[0][1]
    return [domain for domain, score in ranked if score >= max(0.12, top * 0.6)][:2]


def _has_strong_tech_certification(certifications: Optional[List[str]]) -> bool:
    cert_blob = " ".join((item or "").lower() for item in (certifications or []) if item)
    if not cert_blob:
        return False
    return any(marker in cert_blob for marker in CERT_TECH_WHITELIST)


def _has_non_stem_degree_markers(resume_text: str) -> bool:
    text = (resume_text or "").lower()
    if not text:
        return False
    return any(marker in text for marker in DEGREE_NON_STEM_MARKERS)


def _normalized_ratio(score: int | float) -> float:
    return max(0.0, min(1.0, float(score) / 100.0))


def _content_scores(user_skills: List[str]) -> Dict[str, float]:
    user_doc = " ".join(user_skills)

    if not user_doc.strip():
        return {role: 0.0 for role in ROLES}

    user_vector = CONTENT_VECTORIZER.transform([user_doc])
    sims = cosine_similarity(user_vector, ROLE_DOC_MATRIX)[0]

    return {role: float(score) for role, score in zip(ROLES, sims)}


def _matched_required_skills(user_skills: List[str], required_skills: List[str], threshold: int = 86) -> List[str]:
    if not user_skills:
        return []

    def is_short_or_symbol_skill(skill: str) -> bool:
        compact = "".join(ch for ch in skill.lower() if ch.isalnum())
        return len(compact) < 3

    fuzzy_pool = [skill for skill in user_skills if not is_short_or_symbol_skill(skill)]

    matched: List[str] = []
    for required in required_skills:
        if required in user_skills:
            matched.append(required)
            continue

        if is_short_or_symbol_skill(required):
            continue

        if not fuzzy_pool:
            continue

        fuzzy_match = process.extractOne(required, fuzzy_pool, scorer=fuzz.token_set_ratio, score_cutoff=threshold)
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
    required = ROLE_REQUIRED_SKILLS.get(role, [])
    core = required[: min(5, len(required))]
    if not core:
        return 0.0, []

    matched = _matched_required_skills(user_skills, core, threshold=84)
    return len(matched) / len(core), matched


def _tool_project_signal(user_skills: List[str], role: str) -> float:
    required = ROLE_REQUIRED_SKILLS.get(role, [])
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
    for role in ROLES:
        required = ROLE_REQUIRED_SKILLS.get(role, [])
        if not required:
            priors[role] = 0.0
            continue

        matched = _matched_required_skills(user_skills, required)
        priors[role] = float(len(matched) / len(required))
    return priors


def _bert_stub_scores(user_skills: List[str]) -> Dict[str, float]:
    user_set = set(user_skills)
    boosted = {}
    for role in ROLES:
        required = ROLE_REQUIRED_SKILLS.get(role, [])
        matched = _matched_required_skills(user_skills, required)
        required_set = set(required)
        overlap = len(set(matched))
        union = len(user_set | required_set)
        boosted[role] = float(overlap / max(1, union))
    return boosted


def _build_reason(user_skills: List[str], role: str) -> str:
    required = ROLE_REQUIRED_SKILLS.get(role, [])
    core = required[: min(5, len(required))]
    matched = _matched_required_skills(user_skills, required)
    matched_core = _matched_required_skills(user_skills, core)
    matched_set = set(matched)
    matched_core_set = set(matched_core)
    missing = [skill for skill in required if skill not in matched_set]
    missing_core = [skill for skill in core if skill not in matched_core_set]

    if matched:
        preview_count = 3
        matched_preview_list = matched[:preview_count]
        matched_preview = ", ".join(matched_preview_list)
        reason = f"Matched {len(matched)}/{len(required)} required skills"
        if matched_preview:
            hidden_count = max(0, len(matched) - len(matched_preview_list))
            reason += f": {matched_preview}"
            if hidden_count > 0:
                reason += f" (+{hidden_count} more)"
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

    domain_scores = _domain_anchor_scores(normalized_skills, resume_text, certifications)
    dominant_domains = _dominant_domains(domain_scores)
    has_non_stem_degree = _has_non_stem_degree_markers(resume_text)
    has_strong_tech_cert = _has_strong_tech_certification(certifications)

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
    for role in ROLES:
        required_skill_list = ROLE_REQUIRED_SKILLS.get(role, [])
        required_skills = ROLE_REQUIRED_SKILL_SETS.get(role, set())
        role_domains = _role_dominant_domains(role)
        matched_count = len(user_skill_set & required_skills)
        direct_overlap = collab.get(role, 0.0)
        semantic_score = content.get(role, 0.0)
        fuzzy_matched_required = _matched_required_skills(normalized_skills, required_skill_list)
        fuzzy_matched_count = len(fuzzy_matched_required)
        fuzzy_overlap_ratio = fuzzy_matched_count / max(1, len(required_skill_list))
        section_overlap = _section_weighted_role_overlap(required_skill_list, resume_text)

        core_signal, _ = _core_stack_signal(normalized_skills, role)
        tool_signal = _tool_project_signal(normalized_skills, role)
        exp_signal = _experience_signal(experience_years, resume_text)
        cert_signal = _certification_signal(role, certifications)

        if fuzzy_matched_count == 0:
            continue

        if fuzzy_matched_count < 2 and fuzzy_overlap_ratio < 0.22:
            continue

        if role in TECH_ROLE_SUBDOMAIN and not tech_mode and matched_count < 2:
            continue

        if not allow_zero_overlap and matched_count == 0 and (direct_overlap < 0.22 or semantic_score < 0.20):
            continue

        if fuzzy_overlap_ratio < 0.15 and direct_overlap < 0.18 and semantic_score < 0.22:
            continue

        if section_overlap < 0.04 and fuzzy_overlap_ratio < 0.20 and semantic_score < 0.20:
            continue

        if has_non_stem_degree and role in TECH_ROLE_SUBDOMAIN and not has_strong_tech_cert:
            if section_overlap < 0.12 and fuzzy_matched_count < 2 and core_signal < 0.15 and tool_signal < 0.15:
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
                    "section_overlap": round(section_overlap, 3),
                    "core_stack": round(core_signal, 3),
                    "tool_project": round(tool_signal, 3),
                    "experience": round(exp_signal, 3),
                    "certification": round(cert_signal, 3),
                    "domain_alignment": round(
                        float(len(set(dominant_domains) & set(role_domains)) / max(1, len(set(role_domains) or {"_"}))), 3
                    )
                    if dominant_domains and role_domains
                    else 0.0,
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
            or method_scores.get("section_overlap", 0.0) >= 0.10
            or method_scores.get("core_stack", 0.0) >= 0.20
            or method_scores.get("tool_project", 0.0) >= 0.18
        )
        has_strict_semantic_evidence = (
            method_scores.get("content", 0.0) >= 0.24
            or method_scores.get("bert", 0.0) >= 0.20
            or method_scores.get("domain_alignment", 0.0) >= 0.30
        )

        if confidence >= strict_minimum_confidence and (has_strict_skill_evidence or has_strict_semantic_evidence):
            qualified.append(item)
            continue

        has_related_skill_evidence = (
            method_scores.get("matched_required_count", 0) >= 2
            or method_scores.get("collaborative", 0.0) >= 0.10
            or method_scores.get("matched_required_ratio", 0.0) >= 0.10
            or method_scores.get("section_overlap", 0.0) >= 0.06
            or method_scores.get("core_stack", 0.0) >= 0.10
            or method_scores.get("tool_project", 0.0) >= 0.10
        )
        has_related_semantic_evidence = (
            method_scores.get("content", 0.0) >= 0.16
            or method_scores.get("bert", 0.0) >= 0.13
            or method_scores.get("domain_alignment", 0.0) >= 0.20
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
