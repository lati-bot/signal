# Signal

Event intelligence platform for prediction markets. Aggregates markets from Polymarket, Kalshi, and Manifold into a single searchable interface with price history tracking.

## Architecture

```
signal/
├── frontend/          Next.js 14 (App Router, Tailwind, TypeScript)
├── backend/           Python FastAPI
│   ├── app/
│   │   ├── routes/    API endpoints
│   │   ├── models/    SQLAlchemy models
│   │   ├── services/  Platform API clients + scheduler
│   │   └── db/        Database connection
│   ├── schema.sql     Postgres schema
│   └── requirements.txt
└── docker-compose.yml Postgres for local dev
```

## Setup

### Database

```bash
docker compose up -d
```

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env  # edit as needed
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Docs at `/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Data Sources

| Platform | API | Auth |
|----------|-----|------|
| Polymarket | CLOB + Gamma APIs | None (public) |
| Kalshi | REST v2 | API key required |
| Manifold | REST v0 | Optional (rate limits) |

The scheduler refreshes market data every 15 minutes.
