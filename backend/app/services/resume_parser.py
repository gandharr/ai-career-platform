import re
from io import BytesIO
from typing import Dict, List, Set

import pdfplumber

from app.data.taxonomy import CAREER_TAXONOMY


EMAIL_PATTERN = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
PHONE_PATTERN = r"(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{3,4}\)?[\s\-]?)?\d{3}[\s\-]?\d{4}"

BASE_SKILL_DICTIONARY = {
    "python",
    "java",
    "javascript",
    "html",
    "css",
    "react",
    "node.js",
    "machine learning",
    "deep learning",
    "nlp",
    "data analysis",
    "statistics",
    "sql",
    "pharmacology",
    "chemistry",
    "drug safety",
    "clinical research",
    "marketing",
    "digital marketing",
    "graphic design",
    "illustrator",
    "adobe photoshop",
    "figma",
    "accounting",
    "financial modeling",
    "autocad",
    "project management",
    "communication",
}

SKILL_SYNONYMS = {
    "js": "javascript",
    "reactjs": "react",
    "nodejs": "node.js",
    "ml": "machine learning",
    "ai": "machine learning",
    "py": "python",
    "powerbi": "power bi",
    "photoshop": "adobe photoshop",
}

NOISE_TOKENS = {
    "curriculum vitae",
    "resume",
    "professional summary",
    "objective",
    "declaration",
    "references",
}

RESUME_SECTION_KEYWORDS = {
    "education",
    "experience",
    "work experience",
    "projects",
    "skills",
    "technical skills",
    "certifications",
    "internship",
    "internships",
    "objective",
    "summary",
    "profile",
}

CORE_RESUME_SECTION_KEYWORDS = {
    "education",
    "experience",
    "work experience",
    "employment",
    "skills",
    "technical skills",
    "projects",
    "internship",
    "internships",
}

RESUME_TITLE_HINTS = {
    "resume",
    "curriculum vitae",
    "cv",
}

CAREER_PROFILE_LINK_HINTS = {
    "linkedin.com/in/",
    "github.com/",
    "portfolio",
    "behance.net/",
    "leetcode.com/",
    "hackerrank.com/",
}

NON_RESUME_DOCUMENT_KEYWORDS = {
    "invoice",
    "receipt",
    "bank statement",
    "passbook",
    "aadhaar",
    "pan card",
    "hall ticket",
    "question paper",
    "marks memo",
    "semester result",
    "time table",
    "timetable",
    "assignment",
    "charter",
    "project charter",
    "scope",
    "deliverables",
    "stakeholders",
    "milestone",
    "milestones",
    "assumptions",
    "constraints",
    "risk register",
    "issue log",
    "approval",
    "lab record",
    "experiment",
    "project report",
    "abstract",
    "table of contents",
    "chapter 1",
    "introduction",
    "conclusion",
    "certificate of",
    "bonafide",
    "fee receipt",
}


def build_skill_dictionary() -> Set[str]:
    taxonomy_skills = {
        skill.strip().lower()
        for role in CAREER_TAXONOMY.values()
        for skill in role.get("skills", [])
        if isinstance(skill, str) and skill.strip()
    }
    return taxonomy_skills.union(BASE_SKILL_DICTIONARY)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    pages: List[str] = []
    try:
        with pdfplumber.open(BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if not page_text.strip():
                    words = page.extract_words() or []
                    page_text = " ".join(word.get("text", "") for word in words if word.get("text"))
                pages.append(page_text)
    except Exception as exc:
        raise ValueError("Unable to read the uploaded PDF resume.") from exc
    return "\n".join(pages)


def extract_resume_text(file_bytes: bytes, filename: str) -> str:
    lower_name = (filename or "").lower()

    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)

    raise ValueError("Only PDF resume files are accepted.")


def clean_resume_text(text: str) -> str:
    cleaned = (text or "").replace("\ufeff", " ")
    cleaned = cleaned.lower()
    cleaned = re.sub(r"[^a-z0-9+.#/&\-\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def extract_skills_from_text(clean_text: str, skill_dictionary: Set[str]) -> List[str]:
    if not clean_text:
        return []

    expanded_dict = set(skill_dictionary)
    expanded_dict.update(SKILL_SYNONYMS.keys())

    matches: Set[str] = set()
    for skill in sorted(expanded_dict, key=len, reverse=True):
        compact = "".join(ch for ch in skill if ch.isalnum())
        if len(compact) <= 1:
            continue
        pattern = rf"(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])"
        if re.search(pattern, clean_text):
            canonical_skill = SKILL_SYNONYMS.get(skill, skill)
            if canonical_skill not in NOISE_TOKENS:
                matches.add(canonical_skill)

    return sorted(matches)


def extract_resume_lines(raw_text: str) -> List[str]:
    return [line.strip() for line in (raw_text or "").splitlines() if line and line.strip()]


def extract_phone_numbers(raw_text: str) -> List[str]:
    phone_numbers: List[str] = []
    seen_digits: Set[str] = set()

    for match in re.finditer(PHONE_PATTERN, raw_text or ""):
        candidate = match.group(0).strip()
        digits = "".join(ch for ch in candidate if ch.isdigit())
        if len(digits) < 10 or len(digits) > 13 or digits in seen_digits:
            continue
        seen_digits.add(digits)
        phone_numbers.append(candidate)

    return phone_numbers[:3]


def extract_profile_links(raw_text: str) -> List[str]:
    lowered = (raw_text or "").lower()
    return [hint for hint in CAREER_PROFILE_LINK_HINTS if hint in lowered]


def extract_education(lines: List[str]) -> List[str]:
    markers = [
        "b.tech",
        "bachelor",
        "master",
        "university",
        "pharm",
        "mba",
        "degree",
    ]
    return [line for line in lines if any(marker in line.lower() for marker in markers)][:5]


def extract_certifications(lines: List[str]) -> List[str]:
    return [line for line in lines if "cert" in line.lower() or "license" in line.lower()][:8]


def count_keyword_hits(text: str, keywords: Set[str]) -> int:
    normalized_text = (text or "").lower()
    return sum(1 for keyword in keywords if keyword in normalized_text)


def parse_resume(file_bytes: bytes, filename: str) -> Dict:
    raw_text = extract_resume_text(file_bytes, filename)
    lines = extract_resume_lines(raw_text)
    clean_text = clean_resume_text(raw_text)

    email_match = re.search(EMAIL_PATTERN, raw_text)
    name = lines[0] if lines else None

    skill_dictionary = build_skill_dictionary()
    extracted_skills = extract_skills_from_text(clean_text, skill_dictionary)

    return {
        "name": name,
        "email": email_match.group(0) if email_match else None,
        "skills": extracted_skills,
        "education": extract_education(lines),
        "certifications": extract_certifications(lines),
        "phone_numbers": extract_phone_numbers(raw_text),
        "profile_links": extract_profile_links(raw_text),
        "lines": lines,
        "source_filename": filename or "",
        "raw_text": clean_text,
    }


def looks_like_person_name(name: str) -> bool:
    tokens = [token for token in re.split(r"\s+", (name or "").strip()) if token]
    if len(tokens) < 2 or len(tokens) > 5:
        return False
    if any(any(ch.isdigit() for ch in token) for token in tokens):
        return False
    return all(token.replace(".", "").replace("-", "").isalpha() for token in tokens)


def is_resume_profile(profile: Dict) -> bool:
    clean_text = (profile.get("raw_text") or "").lower()
    name = (profile.get("name") or "").strip()
    source_filename = (profile.get("source_filename") or "").lower()
    email = (profile.get("email") or "").strip()
    phone_numbers = profile.get("phone_numbers") or []
    profile_links = profile.get("profile_links") or []
    lines = profile.get("lines") or []
    top_lines_text = " ".join(line.strip().lower() for line in lines[:5])
    skills_count = len(profile.get("skills") or [])
    has_education = bool(profile.get("education"))
    has_certifications = bool(profile.get("certifications"))
    section_hits = count_keyword_hits(clean_text, RESUME_SECTION_KEYWORDS)
    core_section_hits = count_keyword_hits(clean_text, CORE_RESUME_SECTION_KEYWORDS)
    non_resume_hits = count_keyword_hits(clean_text, NON_RESUME_DOCUMENT_KEYWORDS)
    filename_non_resume_hits = count_keyword_hits(source_filename, NON_RESUME_DOCUMENT_KEYWORDS)
    header_non_resume_hits = count_keyword_hits(top_lines_text, NON_RESUME_DOCUMENT_KEYWORDS)
    title_resume_hits = count_keyword_hits(top_lines_text, RESUME_TITLE_HINTS)
    contact_points = int(bool(email)) + int(bool(phone_numbers)) + int(bool(profile_links))
    has_contact_in_header = (
        bool(email and email.lower() in top_lines_text)
        or any(phone.lower() in top_lines_text for phone in phone_numbers)
        or any(link in top_lines_text for link in profile_links)
    )

    has_identity_signals = looks_like_person_name(name) and contact_points >= 1
    has_resume_sections = len(lines) >= 6 and core_section_hits >= 2
    has_skill_depth = skills_count >= 2
    has_supporting_content = has_education or has_certifications or core_section_hits >= 3
    likely_non_resume_document = (
        header_non_resume_hits >= 1
        or ((non_resume_hits + filename_non_resume_hits) >= 2 and section_hits <= 1)
        or (title_resume_hits == 0 and header_non_resume_hits >= 1)
    )

    score = 0
    if looks_like_person_name(name):
        score += 2
    if has_contact_in_header:
        score += 2
    if email:
        score += 2
    if phone_numbers:
        score += 1
    if profile_links:
        score += 1
    if len(lines) >= 8:
        score += 1
    if core_section_hits >= 2:
        score += 2
    if core_section_hits >= 3:
        score += 1
    if skills_count >= 3:
        score += 2
    elif skills_count >= 1:
        score += 1
    if has_education:
        score += 1
    if has_certifications:
        score += 1
    score -= min(4, non_resume_hits + filename_non_resume_hits)

    return (
        not likely_non_resume_document
        and has_identity_signals
        and has_contact_in_header
        and has_resume_sections
        and (has_skill_depth or has_supporting_content)
        and score >= 7
    )
