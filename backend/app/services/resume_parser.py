import re
from io import BytesIO
from typing import Dict, List, Set

import pdfplumber
from docx import Document

from app.data.taxonomy import CAREER_TAXONOMY


EMAIL_PATTERN = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"

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
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if not page_text.strip():
                words = page.extract_words() or []
                page_text = " ".join(word.get("text", "") for word in words if word.get("text"))
            pages.append(page_text)
    return "\n".join(pages)


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(BytesIO(file_bytes))
    paragraphs = [para.text for para in doc.paragraphs if para.text and para.text.strip()]
    return "\n".join(paragraphs)


def extract_resume_text(file_bytes: bytes, filename: str) -> str:
    lower_name = (filename or "").lower()

    if lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if lower_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)

    return file_bytes.decode("utf-8-sig", errors="ignore")


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
        "raw_text": clean_text,
    }


def is_resume_profile(profile: Dict) -> bool:
    clean_text = (profile.get("raw_text") or "").lower()
    name = (profile.get("name") or "").strip()
    email = (profile.get("email") or "").strip()
    skills_count = len(profile.get("skills") or [])
    has_education = bool(profile.get("education"))
    has_certifications = bool(profile.get("certifications"))
    section_hits = sum(1 for keyword in RESUME_SECTION_KEYWORDS if keyword in clean_text)

    has_identity_signals = bool(name) and bool(email)
    has_resume_sections = section_hits >= 2
    has_skill_depth = skills_count >= 2
    has_supporting_content = has_education or has_certifications

    return (
        (has_identity_signals and has_skill_depth)
        or (has_resume_sections and skills_count >= 3)
        or (bool(email) and has_resume_sections and has_supporting_content)
    )
