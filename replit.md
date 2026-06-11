# Manabu — Japanese Learning App

A web app for learning Japanese vocabulary with hiragana, katakana, and kanji practice, answer checking, and progress tracking.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/japanese-learning run dev` — run the frontend (port 23235)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, TailwindCSS, shadcn/ui, framer-motion, wouter

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle ORM schema: `topics.ts`, `words.ts`
- `artifacts/api-server/src/routes/` — API route handlers: `topics.ts`, `words.ts`, `practice.ts`
- `artifacts/japanese-learning/src/pages/` — Frontend pages: `practice.tsx`, `words.tsx`, `topics.tsx`, `stats.tsx`
- `artifacts/japanese-learning/src/components/layout.tsx` — App shell and navigation

## Architecture decisions

- Contract-first: OpenAPI spec written first, then codegen produces React Query hooks and Zod validators
- All practice stats tracked in-DB via `correct_count` / `incorrect_count` columns on `words` table
- Answer checking is case-insensitive and trims whitespace
- `topicId: null` from query params is handled explicitly in the practice route (avoids NaN from `Number(null)`)

## Product

- **Practice** — Select alphabets (hiragana/katakana/kanji) and an optional topic, then see random Japanese words and enter the reading + translation. Immediate feedback shows correct answers on mistakes.
- **Words** — Searchable word library with add/edit/delete and per-word stats (correct/incorrect counts).
- **Topics** — Manage vocabulary themes; words can be assigned to topics for focused practice.
- **Stats** — Accuracy overview, breakdown by alphabet and topic.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change: run `pnpm --filter @workspace/api-spec run codegen` before touching frontend hooks
- After DB schema changes: run `pnpm --filter @workspace/db run push`
- `topicId` query param from frontend can be the string `"null"` — parse it explicitly, don't rely on `Number(null)`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
