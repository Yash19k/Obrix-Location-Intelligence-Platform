# Obrix — Intelligent Location Intelligence Platform

> AI-powered geospatial analytics for smarter site selection.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Leaflet |
| Backend | Django 4.2 + DRF + JWT |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| AI/Data | GeoPandas, Shapely, Scikit-learn, XGBoost |
| DevOps | Docker, GitHub Actions, Render, Vercel |

---

## Quick Start (Docker)

### Prerequisites
- Docker Desktop installed and running
- Git

### 1. Clone & configure

```bash
git clone https://github.com/your-org/obrix.git
cd obrix

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and set a real `SECRET_KEY` and `DB_PASSWORD`.

### 2. Start the stack

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1/ |
| Django Admin | http://localhost:8000/admin/ |
| PostgreSQL | localhost:5432 |
 s
### 3. Create a superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

---

## Development (without Docker)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements/development.txt

# Configure .env
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Project Structure

```
obrix/
├── backend/          # Django + DRF API
│   ├── apps/         # accounts, locations, analysis, reports
│   ├── config/       # settings, urls, wsgi, asgi
│   ├── core/         # shared utilities
│   └── intelligence/ # scoring engine + AI pipeline
├── frontend/         # React + Vite SPA
│   └── src/
│       ├── pages/    # Route-level components
│       ├── components/ # Reusable UI
│       ├── store/    # Zustand state
│       └── services/ # Axios API layer
└── docker-compose.yml
```

---

## Development Phases

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Complete | Foundation — folder structure, Django, React, API |
| 2 | 🔜 Next | Authentication — JWT login/register |
| 3 | ⏳ Planned | Map integration — Leaflet, coordinate picker |
| 4 | ⏳ Planned | Analysis API — mock scoring |
| 5 | ⏳ Planned | OSM data integration |
| 6 | ⏳ Planned | Scoring engine |
| 7 | ⏳ Planned | AI insights |
| 8 | ⏳ Planned | Dashboard, charts, PDF export |
| 9 | ⏳ Planned | ML model (XGBoost) |

---

## API Reference

Base URL: `http://localhost:8000/api/v1/`

All protected endpoints require: `Authorization: Bearer <access_token>`

### Auth
- `POST /auth/register/` — Create account
- `POST /auth/login/` — Login, get JWT
- `POST /auth/token/refresh/` — Refresh token
- `GET /auth/me/` — Current user

### Analysis
- `POST /analysis/` — Submit analysis
- `GET /analysis/` — List analyses
- `GET /analysis/{id}/` — Get with result

---

## License

MIT License — built as a Final Year Project.
