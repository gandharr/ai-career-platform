import json
import os
import time

import requests

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


def check_health():
    res = requests.get(f"{BASE_URL}/health", timeout=10)
    res.raise_for_status()
    return res.json()


def register_or_login(email: str, password: str, name: str):
    reg_payload = {"name": name, "email": email, "password": password}
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload, timeout=15)

    if reg_res.status_code == 200:
        return reg_res.json()["access_token"]

    login_payload = {"email": email, "password": password}
    login_res = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=15)
    if login_res.status_code == 200:
        return login_res.json()["access_token"]

    temp_email = f"smoke_{int(time.time())}@example.com"
    temp_payload = {"name": "Smoke User", "email": temp_email, "password": password}
    temp_reg = requests.post(f"{BASE_URL}/auth/register", json=temp_payload, timeout=15)
    temp_reg.raise_for_status()
    return temp_reg.json()["access_token"]


def check_recommendation_flow(user_email: str):
    recommend_payload = {
        "user_id": user_email,
        "name": "Smoke User",
        "skills": ["python", "sql", "machine learning"],
        "experience_years": 1,
    }
    rec_res = requests.post(f"{BASE_URL}/recommend-careers", json=recommend_payload, timeout=20)
    rec_res.raise_for_status()
    rec_data = rec_res.json()

    top_role = rec_data["recommendations"][0]["role"]
    gap_payload = {"user_skills": recommend_payload["skills"], "target_role": top_role}
    gap_res = requests.post(f"{BASE_URL}/skill-gap", json=gap_payload, timeout=20)
    gap_res.raise_for_status()

    missing_skills = [item["skill"] for item in gap_res.json().get("missing_skills", [])][:3]
    learn_res = requests.post(f"{BASE_URL}/learning-path", json={"missing_skills": missing_skills}, timeout=20)
    learn_res.raise_for_status()

    return {
        "recommendations_count": len(rec_data.get("recommendations", [])),
        "top_role": top_role,
        "missing_skills_count": len(gap_res.json().get("missing_skills", [])),
        "learning_resources_count": len(learn_res.json().get("resources", [])),
    }


def check_profile(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    profile_res = requests.get(f"{BASE_URL}/user/profile", headers=headers, timeout=20)
    profile_res.raise_for_status()
    return profile_res.json()


def main():
    print("1) Health:", check_health())

    email = "intern@example.com"
    password = "password123"
    token = register_or_login(email=email, password=password, name="Intern Demo")
    print("2) Auth: OK")

    flow = check_recommendation_flow(user_email=email)
    print("3) Recommendation Flow:", json.dumps(flow, indent=2))

    profile = check_profile(token)
    print("4) Profile API:", json.dumps({"email": profile["email"], "history_count": len(profile["recent_recommendations"])}, indent=2))

    print("Smoke test passed.")


if __name__ == "__main__":
    main()
