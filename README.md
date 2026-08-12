# मेरा वकील AI — Mera Wakeel AI

A bilingual (Hindi/Hinglish/English) AI-powered legal assistant platform. The app
acts as a caring, experienced senior lawyer persona — helping citizens understand
their legal situation, connect with verified lawyers, track cases, and get
answers backed by Indian law.

## Features

- **AI Legal Assistant** — conversational chat with a senior-lawyer persona, in
  Hindi, Hinglish, or English (Google Gemini + Groq Llama with automatic
  provider fallback).
- **Voice** — speech-to-text (Hindi/English/audio upload), text-to-speech, and a
  full AI voice call mode.
- **Document Analysis** — upload images/PDFs (KYC, FIR, sale deed, etc.) and get
  vision-based extraction with Gemini / Groq multimodal fallback.
- **My Cases** — create and track legal cases, chat history, documents,
  evidence, and AI-saved facts/verdicts.
- **Lawyer Marketplace** — browse verified lawyers, send connection requests,
  accept/reject, rate, and direct-message connected lawyers.
- **RAG Knowledge Base** — Indian statutes (BNS, IPC, CrPC) indexed for
  retrieval-augmented answering.
- **Guest sessions** — anonymous visitors get their own signed session with
  isolated data; sign up to keep everything across devices.

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 6, Tailwind CSS 4 |
| Backend | Node.js, Express 4 (single server serving SPA + API) |
| Database | Supabase (PostgreSQL, RLS) |
| AI | Google Gemini (text/vision/voice), Groq (LLM/whisper/RAG) |
| Security | Helmet, express-rate-limit, HMAC-signed guest session tokens, RLS + server-side ownership checks |

## Project Structure

```
.
├── server.ts            # Express server: SPA serving + all /api routes
├── legalPersona.ts      # Senior lawyer system prompt builder
├── src/                 # React frontend (components, views, lib)
│   ├── lib/             # apiClient (auth interceptor), supabase, groq, gemini, rag
│   └── components/      # UI components + feature views
├── supabase/            # Schema + RLS policies (run in Supabase SQL editor)
├── tests/               # Server test suite (node:test + supertest)
├── schema.sql           # Database schema
├── docker-compose.yml   # One-command container deployment
└── Dockerfile           # Multi-stage production image
```

## Run Locally (Development)

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file from the template and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   At minimum you need `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `SESSION_SECRET` (run
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   to generate one). Add `GEMINI_API_KEY` / `GROQ_API_KEY` for AI features.
3. Start the dev server (Vite HMR + Express API on the same port):
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Database Setup (Supabase)

1. Create a project at https://supabase.com.
2. In **SQL Editor**, run `supabase/schema.sql` (tables) then
   `supabase/rls_policies.sql` (Row Level Security policies + storage buckets).
3. Copy the project URL, anon key, and **service_role** key into `.env`
   (Dashboard → Settings → API).
   > ⚠️ The server uses the service_role key to write on behalf of users.
   > It bypasses RLS — never expose it to the browser or commit it.

## Tests

```bash
npm test        # 15 tests: auth tokens, 401s, ownership, AI endpoint gating
npm run lint    # tsc typecheck (noEmit)
```

## Production Deployment

### (a) Build locally

```bash
npm ci
npm run build    # Vite SPA + esbuild bundle -> dist/ + dist/server.cjs
```

### (b) Required environment variables

| Variable | Required in prod | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key (client, subject to RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Secret server-only key (bypasses RLS) |
| `SESSION_SECRET` | Yes | Random 32-byte hex; signs guest session tokens |
| `PORT` | No (default 3000) | HTTP port the server binds to |
| `APP_URL` | No | Production URL allowed by CORS |
| `GEMINI_API_KEY` | No | Server-side Gemini key |
| `GROQ_API_KEY` | No | Server-side Groq key |

In production the server **fails fast (exits)** if `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `SESSION_SECRET` are
missing.

### (c) Docker deployment

```bash
docker compose up -d --build
```

The app listens on `http://localhost:3000`, restarts on unexpected exit, and
exposes a healthcheck at `/api/health`. Stop with `docker compose down`.

### (d) Direct Node deployment

With Node.js 22+:

```bash
npm ci && npm run build && NODE_ENV=production node dist/server.cjs
```

Run behind a process manager (systemd, PM2) for restart supervision.

### (e) Graceful shutdown

The server handles `SIGTERM`/`SIGINT` by closing the HTTP server, draining
in-flight requests, and exiting cleanly (forced exit after a 10s timeout). Deploy
once with Docker, Kubernetes, systemd, or PM2 and you get clean restarts.

## License

Private — for authorized team use only.