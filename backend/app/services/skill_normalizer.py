from difflib import get_close_matches
from typing import List

from rapidfuzz import process


SKILL_ALIASES = {
    "js": "javascript",
    "ts": "typescript",
    "node": "node.js",
    "nodejs": "node.js",
    "reactjs": "react",
    "py": "python",
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "nlp",
    "k8s": "kubernetes",
    "docker-compose": "docker",
    "postgres": "postgresql",
    "postgre": "postgresql",
    "mongo": "nosql",
    "aws cloud": "aws",
    "gcp cloud": "gcp",
    "rest": "rest api",
    "restful api": "rest api",
    "powerbi": "power bi",
    "tableu": "tableau",
    "html5": "html",
    "css3": "css",
    "ci cd": "ci/cd",
    "dev sec ops": "devops",
}


def normalize_skills(raw_skills: List[str], taxonomy_skills: List[str]) -> List[str]:
    normalized = []
    taxonomy_lower = {skill.lower(): skill for skill in taxonomy_skills}

    def token_overlap(left: str, right: str) -> int:
        left_tokens = {token for token in left.split() if token}
        right_tokens = {token for token in right.split() if token}
        return len(left_tokens & right_tokens)

    for skill in raw_skills:
        skill_l = skill.lower().strip()
        if not skill_l:
            continue

        candidate_terms = {skill_l}
        for separator in [",", "/", "|", ";"]:
            if separator in skill_l:
                candidate_terms.update({item.strip() for item in skill_l.split(separator) if item.strip()})

        expanded_terms = set(candidate_terms)
        for term in candidate_terms:
            alias = SKILL_ALIASES.get(term)
            if alias:
                expanded_terms.add(alias)
            compact = term.replace(" ", "")
            alias_compact = SKILL_ALIASES.get(compact)
            if alias_compact:
                expanded_terms.add(alias_compact)

        matched_any = False
        for term in sorted(expanded_terms, key=len, reverse=True):
            if term in taxonomy_lower:
                normalized.append(taxonomy_lower[term])
                matched_any = True
                break

        if matched_any:
            continue

        fuzzy_match = process.extractOne(skill_l, list(taxonomy_lower.keys()), score_cutoff=86)
        if fuzzy_match:
            candidate = fuzzy_match[0]
            if " " not in skill_l or " " not in candidate or token_overlap(skill_l, candidate) > 0:
                normalized.append(taxonomy_lower[candidate])
                continue

        close = get_close_matches(skill_l, list(taxonomy_lower.keys()), n=1, cutoff=0.8)
        if close:
            normalized.append(taxonomy_lower[close[0]])

    return sorted(set(normalized))
