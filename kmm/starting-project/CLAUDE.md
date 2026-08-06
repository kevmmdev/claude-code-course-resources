# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Building a **Note-Taking Web App** with:
- Authenticated users (email/password via better-auth)
- Rich text editing with TipTap (bold, italic, headings, code, lists, horizontal rules)
- Note CRUD operations (create, read, update, delete)
- Public sharing of notes via unique slugs (public read-only access via `/p/{slug}`)

**Reference @SPEC.MD for complete requirements, database schema, API design, and architectural details.**

## Tech Stack

- **Runtime**: Bun (dev & production)
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS 4 + PostCSS
- **Database**: SQLite (via Bun's native client)
- **Rich Text**: TipTap + @tiptap/starter-kit
- **Auth**: better-auth (handles DB schema & middleware)
- **Validation**: Zod

## Development Commands

```bash
bun dev              # Start dev server (http://localhost:3000)
bun run build        # Build + TypeScript type check
bun run lint         # ESLint check
bun start            # Start production server
```

## Architecture Overview

This follows Next.js 16 App Router best practices:

### Frontend & Backend (Single Next.js Process)

**Presentation Layer** (`app/`)
- Server components by default (for data fetching)
- Client components (`use client`) only for interactivity (TipTap editor, toggles, forms)
- TailwindCSS for styling
- Routes:
  - `/` – landing page
  - `/authenticate` – login/signup
  - `/dashboard` – notes list (RSC)
  - `/notes/[id]` – editor page
  - `/p/[slug]` – public note viewer

**Data Access Layer** (`lib/`)
- `db.ts` – Bun SQLite initialization and query helpers
- `notes.ts` – Note repository functions (CRUD, sharing logic)
- `auth.ts` – better-auth configuration

**Server Actions** (`lib/actions/`)
- Form mutations use `'use server'` server actions (not POST routes)
- Authentication verified server-side before mutations

**API Routes** (`app/api/`)
- Only `/api/auth/[...all]` for better-auth OAuth/credential handling
- No custom JSON APIs—use server actions for mutations

### Database (SQLite)

Single `data/app.db` file with:
- **better-auth tables**: `user`, `session`, `account`, `verification` (managed by better-auth)
- **notes table**:
  ```sql
  CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_json TEXT NOT NULL,       -- Stringified TipTap JSON
    is_public INTEGER DEFAULT 0,
    public_slug TEXT UNIQUE,          -- 16+ char random slug
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id)
  );
  ```
  - **Indexes**: `idx_notes_user_id`, `idx_notes_public_slug`, `idx_notes_is_public`

**Authorization**: Every note query filters by `user_id` to prevent cross-user access.

## Code Patterns

### TypeScript

- **No `any` types**—always provide proper types
- **No type casting**—avoid `as` assertions; use generics for type-safe DB queries
- Path alias `@/*` maps to project root for clean imports

### Bun-First

- Use Bun's native APIs: `Bun.file()`, `Bun.sql()` for SQLite
- Prefer over Node.js APIs or third-party libraries

### Validation

- Use **Zod** for all input validation (form submissions, API payloads)
- Define schemas at boundaries (server actions, route handlers)

### React & Next.js

- **Server components by default** – fetch data in RSC, pass to children
- **Client components only when needed** – state, event handlers, browser APIs
- **Server actions for mutations** – define with `'use server'` (not POST routes)
- No API routes except better-auth

### Database Queries

Helper functions in `lib/db.ts` provide type-safe access:
```typescript
query<T>(sql: string, params?: any[]): T[]
get<T>(sql: string, params?: any[]): T | undefined
run(sql: string, params?: any[]): void
```

Example:
```typescript
const notes = query<Note>(
  'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
  [userId]
);
```

### Security

- Server actions verify authentication (via better-auth session)
- Verify ownership before accessing/modifying notes
- TipTap content is JSON, never use `dangerouslySetInnerHTML`
- Public note slugs: 16+ character random strings (use `nanoid()`)

## Testing Changes

After every task:

1. **Type check**: `bun run build` (detects type errors)
2. **Lint**: `bun run lint` (code quality)
3. **Browser testing**: Start `bun dev` and manually verify:
   - Forms work (login, create note, edit)
   - Editor interactions (bold, heading, code block buttons)
   - Sharing toggle shows/hides public URL
   - Public notes render correctly
   - Auth flows work (sign up, log in, log out)

**Do NOT assume UI code works without browser verification.**

## File Structure

```
app/
  api/auth/[...all]/route.ts    # better-auth only
  authenticate/                  # Login/signup pages
  dashboard/                      # Notes list
  notes/[id]/                     # Editor page
  p/[slug]/                       # Public note view
  layout.tsx                      # Root layout
  page.tsx                        # Home/landing
  globals.css

lib/
  db.ts                          # Database access
  notes.ts                        # Note repository
  auth.ts                         # better-auth config
  actions/notes.ts               # Server actions

components/                      # Shared React components

public/                          # Static assets

SPEC.MD                          # Technical specification
```

## Key Implementation Notes

- **Database initialization**: Create tables when app first starts (or via migration script)
- **TipTap integration**: Use `StarterKit` + `Code` + `CodeBlock` extensions; store as JSON
- **Auth**: better-auth provides middleware and session helpers; integrate into layout
- **Timestamps**: SQLite `datetime('now')` for `created_at`/`updated_at`; always update on modify
- **UI**: Minimal design with Tailwind; prioritize clarity and keyboard navigation

## Documentation Reference

Consult official docs for up-to-date information:
- Next.js: https://nextjs.org/docs
- TipTap: https://tiptap.dev/docs
- better-auth: https://better-auth.com
- Zod: https://zod.dev
- Bun: https://bun.sh/docs

## Philosophy

This is production code for a course—every pattern will be copied. Optimize for clarity and maintainability. Leave code better than you found it.
