import re
from io import BytesIO
from typing import Dict, List

import pdfplumber
from docx import Document

from app.data.taxonomy import CAREER_TAXONOMY


EMAIL_PATTERN = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"


def _extract_taxonomy_skills(text: str) -> List[str]:
    taxonomy_skills = sorted(
        {skill.strip().lower() for role in CAREER_TAXONOMY.values() for skill in role.get("skills", []) if skill and skill.strip()},
        key=len,
        reverse=True,
    )

    normalized_text = re.sub(r"\s+", " ", text.lower())
    matched: List[str] = []

    for skill in taxonomy_skills:
        pattern = rf"(?<![a-z0-9]){re.escape(skill)}(?![a-z0-9])"
        if re.search(pattern, normalized_text):
            matched.append(skill)

    return sorted(set(matched))


def _extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts: List[str] = []
    with pdfplumber.open(BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text_parts.append(page.extract_text() or "")
    return "\n".join(text_parts)


def _extract_text_from_docx(file_bytes: bytes) -> str:
    document = Document(BytesIO(file_bytes))
    return "\n".join([para.text for para in document.paragraphs if para.text])


def parse_resume(file_bytes: bytes, filename: str) -> Dict:
    file_name_lower = filename.lower()
    if file_name_lower.endswith(".pdf"):
        text = _extract_text_from_pdf(file_bytes)
    elif file_name_lower.endswith(".docx"):
        text = _extract_text_from_docx(file_bytes)
    else:
        text = file_bytes.decode("utf-8-sig", errors="ignore")

    text = text.lstrip("\ufeff")

    lines = [line.strip().lstrip("\ufeff") for line in text.splitlines() if line.strip()]

    name = lines[0] if lines else None
    email_match = re.search(EMAIL_PATTERN, text)
    email = email_match.group(0) if email_match else None

    found_skills = _extract_taxonomy_skills(text)

    education = [line for line in lines if any(k in line.lower() for k in ["b.tech", "bachelor", "master", "university"])][:3]
    certifications = [line for line in lines if "cert" in line.lower()][:5]

    return {
        "name": name,
        "email": email,
        "skills": found_skills,
        "education": education,
        "certifications": certifications,
        "raw_text": text,
    }
