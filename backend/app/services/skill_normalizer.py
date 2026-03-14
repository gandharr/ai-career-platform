from difflib import get_close_matches
from typing import List

from rapidfuzz import process


def normalize_skills(raw_skills: List[str], taxonomy_skills: List[str]) -> List[str]:
    normalized = []
    taxonomy_lower = {skill.lower(): skill for skill in taxonomy_skills}

    for skill in raw_skills:
        skill_l = skill.lower().strip()

        if skill_l in taxonomy_lower:
            normalized.append(taxonomy_lower[skill_l])
            continue

        fuzzy_match = process.extractOne(skill_l, list(taxonomy_lower.keys()), score_cutoff=80)
        if fuzzy_match:
            normalized.append(taxonomy_lower[fuzzy_match[0]])
            continue

        close = get_close_matches(skill_l, list(taxonomy_lower.keys()), n=1, cutoff=0.8)
        if close:
            normalized.append(taxonomy_lower[close[0]])

    return sorted(set(normalized))
