# Leandro Baterías — AGENTS.md

## Stack

- **Frontend**: React 18+, Vite (SPA), Tailwind CSS, TypeScript
- **Backend**: Express + Vite hybrid server (`server.ts:1-164`)
- **Database**: Supabase (PostgreSQL)
- **Icons**: lucide-react; **Animations**: framer-motion

## Entrypoints

| Purpose | File |
|---|---|
| Express + Vite server | `server.ts` |
| Database layer | `server_db.ts` (missing — needs creation) |
| Frontend source | `src/` (missing — needs creation) |
| Frontend types | `src/types` (missing — exports `Product`, `Order`) |

## Commands

Install deps (requires a valid `package.json`):
```
npm install
```

Start dev server (Vite middleware mode):
```
npm run dev
```
Server runs on `http://0.0.0.0:3000`.

## Architecture

- `server.ts` starts an Express app on port 3000 that:
  - Serves API routes (`/api/products`, `/api/orders`, `/api/db-status`) backed by Supabase
  - In dev: uses Vite in `middlewareMode` to serve the React SPA
  - In prod: serves static `dist/` folder, falls back to `index.html` for SPA routing
- All database queries go through `server_db.ts` (imports from `./src/types`)

## State

The project is **incomplete** — `server_db.ts`, `src/`, `package.json`, `vite.config.*`, `tsconfig.json`, `postcss.config.*`, `tailwind.config.*`, and `index.html` are all missing and must be created. Only `server.ts` and `.env` exist.

## Env

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | `.env` |
| `VITE_SUPABASE_ANON_KEY` | `.env` |
| `NODE_ENV` | set at runtime (`production` enables static serving) |
