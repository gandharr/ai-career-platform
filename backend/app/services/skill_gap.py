from typing import Dict, List

from app.data.taxonomy import CAREER_TAXONOMY


def skill_gap_report(user_skills: List[str], target_role: str) -> Dict:
    role_data = CAREER_TAXONOMY.get(target_role)
    if not role_data:
        return {"target_role": target_role, "missing_skills": []}

    required = [s.lower() for s in role_data["skills"]]
    current = set([s.lower() for s in user_skills])

    missing = []
    for index, skill in enumerate(required):
        if skill not in current:
            importance = round(1.0 - (index * 0.1), 2)
            missing.append({"skill": skill, "importance": max(0.5, importance)})

    missing.sort(key=lambda x: x["importance"], reverse=True)
    return {"target_role": target_role, "missing_skills": missing}
