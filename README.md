# AI Career Recommendation Platform

Internship-ready end-to-end implementation with short, explainable code.

## Implemented Features
- Resume parsing for `.pdf`, `.docx`, `.txt`
- Taxonomy-wide skill extraction + normalization (tech + non-tech domains)
- Hybrid recommendation engine (content + overlap + semantic score)
- Explainability output (matched/missing skills + method-level scores)
- Skill-gap analyzer + learning resource recommendations
- JWT auth (register/login) + protected profile API
- Account-only dashboard access with sign-out state reset
- PostgreSQL persistence for users/recommendation logs
- MongoDB storage for recommendation history events
- React dashboard with upload/manual skills, charts, and PDF export
- Docker Compose with backend, frontend, PostgreSQL, MongoDB
- GitHub Actions CI workflow

## Tech Stack
- Frontend: React + Tailwind + Recharts + jsPDF
- Backend: FastAPI + scikit-learn + RapidFuzz + SQLAlchemy
- Databases: PostgreSQL + MongoDB
- Auth: JWT (OAuth2 bearer token flow)
- Deployment: Docker + docker-compose

## Project Structure
- `backend/app/main.py` - API routes and orchestration
- `backend/app/services/` - parser, recommender, skill-gap, learning resources, XAI
- `backend/app/data/taxonomy.py` - cross-domain role taxonomy and required skills
- `backend/app/models.py` - SQLAlchemy models
- `frontend/src/App.jsx` - dashboard workflow UI
- `scripts/` - PowerShell helper scripts for demo and cleanup

## Run with Docker (Recommended)
```bash
cd ai-career-platform
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend Docs: http://localhost:8000/docs

## Local Development
### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Demo Helper Scripts
Use these before presentation to ensure demo data and APIs are ready.

### One-click demo run (Windows PowerShell)
From project root:
```powershell
./scripts/demo.ps1
```

This command will:
1. Build/start all containers
2. Wait for backend health check
3. Seed demo data
4. Run smoke tests
5. Open frontend and API docs in browser

### One-click cleanup/reset
```powershell
./scripts/cleanup.ps1
```

Use this after your demo to stop everything and reset DB volumes for a fresh run.

### Seed demo data
```bash
cd backend
python scripts/seed_data.py
```

### Run smoke test
Make sure backend is running, then:
```bash
cd backend
python scripts/smoke_test.py
```

Optional custom API URL:
```bash
set API_BASE_URL=http://localhost:8000
python scripts/smoke_test.py
```

## Main API Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `POST /parse-resume`
- `POST /recommend-careers`
- `POST /skill-gap`
- `POST /learning-path`
- `GET /user/profile` (requires bearer token)

## Deployment Notes
- GitHub Pages can host only the static frontend; it cannot run FastAPI, PostgreSQL, or MongoDB.
- Recommended production split:
	- Frontend: GitHub Pages / Vercel / Netlify
	- Backend: Render / Railway / Fly.io / VM
	- Databases: managed PostgreSQL + MongoDB Atlas (or hosted equivalents)
- Set frontend API base URL via `VITE_API_URL` to the deployed backend.
- Ensure backend CORS allows your deployed frontend origin.

## Notes for Presentation
- Keep explanation of hybrid score simple:
	`final = 0.55*content + 0.30*overlap + 0.15*semantic`
- If no exact normalized overlap is found, fallback mode can still return top likely roles from user-provided keywords.
- Explainability is shown directly per role in the dashboard.
