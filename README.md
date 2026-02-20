# SwiftyCare

AI-assisted documentation workflow for Emergency Departments. Captures structured patient inputs, generates clinical notes and discharge summaries, and prepares for hospital system integration.

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────┐
│  React SPA  │──/api──▶│  Express API │──────▶  │ MongoDB │
│  (Vite)     │         │  (Node.js)   │         └─────────┘
│  port 5173  │         │  port 3001   │──────▶  OpenAI API
└─────────────┘         └──────────────┘
```

- **Frontend** (`apps/web`): React 18 + TypeScript + Vite + Tailwind CSS
- **Backend** (`apps/api`): Express 5 + TypeScript + Mongoose ODM
- **Database**: MongoDB (local or Atlas)
- **AI**: OpenAI GPT-4o-mini for clinical summaries and differential diagnosis
- **i18n**: English + Hebrew via i18next

### Key workflows

1. **Patient intake** — patient scans QR / opens link, enters name + national ID → case created
2. **Questionnaire** — multi-step medical questionnaire (history, symptoms, medications)
3. **Triage vitals** — nurse enters BP, HR, SpO2, temp, pain score
4. **Doctor dashboard** — view cases, generate AI summary + differential diagnosis, order tests

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3.4, Radix UI primitives |
| Data fetching | TanStack React Query |
| Routing | React Router 7 |
| i18n | i18next (EN / HE) |
| Backend | Express 5 + TypeScript |
| Database | MongoDB via Mongoose 8 |
| AI | OpenAI SDK (GPT-4o-mini) |
| Dev runner | tsx (watch mode) |

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **MongoDB** — one of:
  - Local install (`mongod` running on port 27017)
  - [MongoDB Atlas](https://cloud.mongodb.com) free cluster
  - Docker: `docker run -d -p 27017:27017 mongo:8`
- **OpenAI API key** (required only for AI summary/diagnosis features)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> && cd SwiftyCare

# Install API dependencies
cd apps/api && npm install

# Install web dependencies
cd ../web && npm install
```

### 2. Configure environment variables

**API** — copy the template and fill in values:

```bash
cp apps/api/.env.example apps/api/.env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/swiftycare` | MongoDB connection string |
| `OPENAI_API_KEY` | For AI features | — | OpenAI API key |
| `PORT` | No | `3001` | API server port |
| `CORS_ORIGINS` | No | — | Comma-separated allowed origins (overrides defaults) |

**Web** — copy the template:

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | _(empty — uses Vite proxy)_ | Set for production/tunnel deployments |
| `VITE_DOCTOR_PASSCODE` | No | `swiftycare` | Doctor login passcode |

### 3. Start MongoDB (if using local)

```bash
# Via Homebrew
brew services start mongodb-community

# Or via Docker
docker run -d -p 27017:27017 --name swiftycare-mongo mongo:8

# Or direct binary (if downloaded manually)
mongod --dbpath /tmp/swiftycare-db --port 27017
```

## Run (development)

Start both services in separate terminals:

```bash
# Terminal 1 — API
cd apps/api && npm run dev
# → http://localhost:3001

# Terminal 2 — Web
cd apps/web && npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` to `localhost:3001` automatically — no `VITE_API_BASE_URL` needed for local dev.

### Verify

```bash
# API health check
curl http://localhost:3001/health

# List cases (through Vite proxy)
curl http://localhost:5173/api/cases

# Create a test case
curl -X POST http://localhost:5173/api/cases \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Test Patient","nationalId":"123456"}'
```

## API Endpoints

All routes are under `/api/cases`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cases` | List all cases |
| POST | `/api/cases` | Create a case (`patientName`, `nationalId`) |
| GET | `/api/cases/:id` | Get case by ID |
| DELETE | `/api/cases/:id` | Delete case + associated questionnaire |
| GET | `/api/cases/:id/questionnaire` | Get questionnaire for a case |
| POST | `/api/cases/:id/questionnaire` | Save questionnaire answers |
| PATCH | `/api/cases/:id/status` | Update status (`open`, `in_progress`, `closed`, `cancelled`) |
| POST | `/api/cases/:id/vitals` | Save vital signs |
| POST | `/api/cases/:id/summary` | Generate AI clinical summary |
| POST | `/api/cases/:id/diagnosis` | Generate AI differential diagnosis |
| POST | `/api/cases/:id/order-tests` | Order tests and close case |

## Project Structure

```
SwiftyCare/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── index.ts        # Entry: server, CORS, DB connection
│   │   │   ├── routes/
│   │   │   │   └── caseRoutes.ts
│   │   │   └── models/
│   │   │       ├── Case.ts
│   │   │       └── Questionnaire.ts
│   │   ├── .env.example
│   │   └── package.json
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── App.tsx         # Router
│       │   ├── lib/api.ts      # API client
│       │   ├── i18n/           # Translations (EN/HE)
│       │   ├── pages/          # Page components
│       │   └── components/     # Shared UI components
│       ├── .env.example
│       ├── vite.config.ts
│       └── package.json
├── .gitignore
└── README.md                   # ← You are here
```

## Tunneling (sharing locally-running app)

To share the app with others for demos without deploying:

### Quick tunnel (Cloudflare)

```bash
# Expose web app
cloudflared tunnel --url http://localhost:5173

# Expose API (in another terminal)
cloudflared tunnel --url http://localhost:3001
```

Set `VITE_API_BASE_URL` in `apps/web/.env` to the API tunnel URL, then restart Vite.

### Named tunnel (persistent hostnames)

```bash
# One-time setup
cloudflared tunnel create swiftycare
cloudflared tunnel route dns swiftycare demo.swifty-care.com
cloudflared tunnel route dns swiftycare api.swifty-care.com
```

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: swiftycare
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: demo.swifty-care.com
    service: http://localhost:5173
  - hostname: api.swifty-care.com
    service: http://localhost:3001
  - service: http_status:404
```

```bash
# Set production API URL and start
# apps/web/.env:
#   VITE_API_BASE_URL=https://api.swifty-care.com

cloudflared tunnel run swiftycare
```

### ngrok alternative

```bash
ngrok http 5173    # Web
ngrok http 3001    # API (separate terminal)
```

## Troubleshooting

### "Database is not connected" on case creation

- Check MongoDB is running: `curl http://localhost:3001/health`
- Verify `MONGODB_URI` in `apps/api/.env`
- For Atlas: ensure your IP is whitelisted in Network Access

### CORS errors in browser console

- The API allows `localhost:*`, `demo.swifty-care.com`, `*.trycloudflare.com`, and `*.ngrok-free.app` by default
- For custom domains, set `CORS_ORIGINS=https://your-domain.com` in `apps/api/.env`

### "Invalid host header" from Vite

- Add the hostname to `allowedHosts` in `apps/web/vite.config.ts`

### Port already in use

```bash
# Find the process
lsof -i :5173   # or :3001
# Kill it
kill -9 <PID>
```

### API returns 500 on AI summary/diagnosis

- Verify `OPENAI_API_KEY` is set in `apps/api/.env`
- Check your OpenAI account has billing/credits at https://platform.openai.com

## Deployment

### Option A: Platform-as-a-Service (recommended for MVP)

| Service | What to deploy | Notes |
|---------|---------------|-------|
| **Render / Railway / Fly.io** | `apps/api` | Set env vars in dashboard |
| **Vercel / Netlify** | `apps/web` (static build) | Build command: `cd apps/web && npm run build` |
| **MongoDB Atlas** | Database | Free M0 cluster is sufficient |

Build the frontend for production:

```bash
cd apps/web
VITE_API_BASE_URL=https://your-api-domain.com npm run build
# Output in apps/web/dist/
```

### Option B: Docker (self-hosted)

Create a `Dockerfile` for the API and serve the frontend via nginx or a CDN. Detailed Docker setup is planned for a future iteration.

### Environment checklist for deployment

- [ ] `MONGODB_URI` pointing to a production database (Atlas recommended)
- [ ] `OPENAI_API_KEY` set as a secret (not in code)
- [ ] `CORS_ORIGINS` set to your frontend domain
- [ ] `VITE_API_BASE_URL` set at build time for the frontend
- [ ] `VITE_DOCTOR_PASSCODE` changed from the default

## License

Proprietary — Swifty Medical 2025. All rights reserved.
