# HireLens — AI-Powered CV Search

This repo contains a NestJS backend and a Next.js (App Router) frontend for semantic CV search powered by Pinecone and OpenAI. The frontend now includes a landing page, Google OAuth via NextAuth, and a minimal persistence endpoint to store user emails in Supabase.

## Monorepo Layout

- `backend/` — NestJS API (upload/search/CV endpoints)
- `frontend/` — Next.js 14 App Router UI

## Prerequisites

- Node.js 18+
- npm
- Supabase project (optional for minimal email persistence)
- Google OAuth credentials (OAuth consent + Web app client)

## Environment Variables

Create `frontend/.env.local` with:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional, only if you enable minimal email persistence
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

For the backend, copy `env.example` as needed and set your OpenAI/Pinecone keys.

## Install & Run

In two terminals:

- Frontend
  - `cd frontend`
  - `npm install`
  - `npm run dev`
  - App runs at http://localhost:3000

- Backend
  - `cd backend`
  - `npm install`
  - `npm run start:dev`
  - API runs at http://localhost:3001

## Auth Model

- NextAuth (Google provider) with JWT-only sessions (no DB adapter required)
- Protected routes via middleware: `/search`, `/upload`
- Landing page at `/` with CTA to sign in

## Minimal Email Persistence (Optional)

If you only want to store user emails in your DB while keeping JWT sessions on the frontend:

1) Create the table in Supabase

- Open Supabase SQL Editor and run:
  - `frontend/supabase-users.sql`

This creates `public.app_users (id, email, created_at)` and permissive RLS for quick start.

2) API route (already included)

- `frontend/app/api/user/upsert/route.ts` — upserts `{ email }` into `public.app_users` using the service role key.

3) Automatic upsert after sign-in

- `frontend/components/Providers.tsx` triggers a POST to `/api/user/upsert` once a session with `user.email` is available.

4) Required env vars (frontend)

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Note: Service role is used server-side only in the API route. Do not expose it in client code.

## Troubleshooting

- "Cannot GET /api/auth/signin" — Ensure Next.js rewrites do not proxy `/api/auth/*` to the backend. See `frontend/next.config.js`.
- Supabase errors (PGRST106) — With JWT-only auth, no adapter/DB is needed. The optional email upsert uses a simple table and service role via our API route.
- Google OAuth errors — Verify redirect URIs include `http://localhost:3000/api/auth/callback/google`.

## Notes

- For full persistence (users/accounts/sessions), use Prisma + PostgreSQL later. For now, the JWT-only flow keeps auth simple and fast.
- Frontend docs: see `frontend/README.md` for more detailed steps and screenshots. 