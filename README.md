# AI Career Recommendation Platform

An internship-ready, full-stack platform that parses resumes and recommends the **best-fit careers based strictly on detected skills**.

## Live Links
- Frontend: [https://gandharr.github.io/ai-career-platform/](https://gandharr.github.io/ai-career-platform/)
- Backend Health: [https://ai-career-platform-api.onrender.com/health](https://ai-career-platform-api.onrender.com/health)
- Swagger Docs: [https://ai-career-platform-api.onrender.com/docs](https://ai-career-platform-api.onrender.com/docs)

## Screenshots

### Dashboard
![CareerAI Dashboard](https://raw.githubusercontent.com/gandharr/ai-career-platform/main/docs/screenshots/dashboard-home.png)

### API Docs
![CareerAI API Docs](https://raw.githubusercontent.com/gandharr/ai-career-platform/main/docs/screenshots/api-docs.png)

## Why this project stands out
- Multi-format resume parsing (`.pdf`, `.docx`, `.txt`)
- NLP-style dictionary-based skill extraction from real resume text
- Deterministic career scoring using:
  - required-skill overlap
  - cosine similarity on skill sets
- Top **10** role recommendations with:
  - role name
  - matching score
  - matched skills
- Explainability + skill-gap analysis + learning resources
- End-to-end flow with auth, profile view, recommendations, and PDF report

## End-to-end user flow
1. **Login / Register**
2. **Upload Resume** (or manual skill input)
3. **Candidate Profile** (parsed skills + identity)
4. **Career Recommendations** (Top 10)
5. **Explainability** (matched/missing evidence)
6. **Skill Gap + Learning Path**

## Recommendation Architecture (Current)

### 1) Resume Text Extraction
- Extract text from PDF, DOCX, TXT
- Normalize text: lowercase, remove special symbols, normalize whitespace

### 2) Skill Extraction
- Build combined skill dictionary from:
  - career taxonomy (`backend/app/data/taxonomy.py`)
  - core domain skill set
- Detect exact and synonym-mapped skills from cleaned text

### 3) Career-Skill Dataset
- Uses structured role-to-skills mapping from taxonomy
- Supports cross-domain careers: CS, Business, Arts, Pharmacy, etc.

### 4) Career Matching Algorithm
For each role:
- `matched = user_skills ∩ role_required_skills`
- `match_ratio = |matched| / |required|`
- `cosine = |matched| / sqrt(|user| * |required|)`
- `score = 0.65 * cosine + 0.35 * match_ratio`

### 5) Ranking & Output
- Sort by score (desc), then matched count
- Return top **10** recommendations with deterministic order

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Recharts, jsPDF
- **Backend:** FastAPI, SQLAlchemy, RapidFuzz, pdfplumber, python-docx
- **Databases:**
  - PostgreSQL (users + logs)
  - MongoDB (history/events)
- **Auth:** JWT Bearer tokens
- **Deployment:** GitHub Pages (frontend) + Render (backend)

## Project Structure
- `frontend/` → UI, auth, charts, PDF export
- `backend/app/main.py` → API routing and orchestration
- `backend/app/services/resume_parser.py` → text + skill extraction
- `backend/app/services/recommender.py` → deterministic ranking logic
- `backend/app/services/xai.py` → matched/missing explanation
- `backend/app/services/skill_gap.py` → missing-skill priority report
- `backend/app/data/taxonomy.py` → career-skill mapping dataset

## Run Locally

### Option A: Docker (recommended)
```bash
cd ai-career-platform
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend Docs: http://localhost:8000/docs

### Option B: Manual setup

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /parse-resume`
- `POST /recommend-careers`
- `POST /skill-gap`
- `POST /learning-path`
- `GET /user/profile` (protected)

## Environment Variables

### Backend
- `POSTGRES_URL`
- `MONGO_URL`
- `MONGO_DB_NAME`
- `SECRET_KEY`
- `CORS_ORIGINS`

### Frontend
- `VITE_API_URL`

## Demo Scripts (Windows PowerShell)

### One-click demo
```powershell
./scripts/demo.ps1
```

### Cleanup
```powershell
./scripts/cleanup.ps1
```

## Academic / Viva Talking Points
- Problem: generic and misleading career suggestions across domains
- Fix: deterministic skill-grounded recommender with modular architecture
- Outcome: domain-consistent recommendations for CS, Arts, Pharmacy, Business resumes
- Added reliability: clear user flow, explainability, and top-10 ranked results
