# AGENTS.md

## Cursor Cloud specific instructions

### Overview

SwiftyCare is a two-app project (not a monorepo with workspace tooling). Each app has independent `package.json` and `node_modules`:

- **`apps/api`** — Express 5 + TypeScript backend (port 3001)
- **`apps/web`** — React 18 + Vite + TypeScript frontend (port 5173)

### Prerequisites

- **MongoDB** must be running before the API can serve requests. The recommended approach in this environment is Docker: `sudo docker run -d -p 27017:27017 --name swiftycare-mongo mongo:8`. If the container already exists, start it with `sudo docker start swiftycare-mongo`.
- **OpenAI API key** is only needed for AI summary/diagnosis features; the app starts fine without it.

### Running services

1. Start MongoDB (see above)
2. API: `cd apps/api && npm run dev` (tsx watch, port 3001)
3. Web: `cd apps/web && npm run dev` (Vite dev server, port 5173)
4. Health check: `curl http://localhost:3001/health`

The Vite dev server proxies `/api/*` to `localhost:3001` automatically.

### Lint / Build / Test

- **Lint (web only):** `cd apps/web && npm run lint` — ESLint with TypeScript and React plugins. Note: the codebase has ~19 pre-existing lint errors (`@typescript-eslint/no-explicit-any`, `no-useless-escape`, etc.).
- **TypeScript check (API):** `cd apps/api && npx tsc --noEmit`
- **TypeScript check (web):** `cd apps/web && npx tsc -b`
- **Build API:** `cd apps/api && npm run build`
- **Build web:** `cd apps/web && npm run build` (runs `tsc -b && vite build`)
- **Tests:** No automated test suite exists — the API `test` script is a placeholder (`echo "Error: no test specified"`).

### Environment files

Copy `.env.example` to `.env` in both `apps/api/` and `apps/web/`. Key variables are documented in the README. The doctor dashboard passcode defaults to `swiftycare`.

### Docker in this environment

Docker runs nested (Docker-in-Docker inside Firecracker). The daemon must be started manually: `sudo dockerd &>/tmp/dockerd.log &`. The storage driver is set to `fuse-overlayfs` and iptables uses legacy mode — both are already configured.
