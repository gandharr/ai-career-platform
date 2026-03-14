from typing import List


def suggest_learning_resources(missing_skills: List[str]):
    resources = []
    for skill in missing_skills:
        resources.extend(
            [
                {
                    "skill": skill,
                    "title": f"{skill.title()} - Beginner to Advanced",
                    "url": f"https://www.youtube.com/results?search_query={skill}+course",
                    "provider": "YouTube",
                },
                {
                    "skill": skill,
                    "title": f"{skill.title()} Specialization",
                    "url": f"https://www.coursera.org/search?query={skill}",
                    "provider": "Coursera",
                },
                {
                    "skill": skill,
                    "title": f"{skill.title()} Bootcamp",
                    "url": f"https://www.udemy.com/courses/search/?q={skill}",
                    "provider": "Udemy",
                },
            ]
        )
    return resources
