# Technical Specification – Note Taking Web App

## 1. Overview

A web application where authenticated users can create, view, edit, delete, and publicly share rich-text notes. Notes are created with TipTap, stored as JSON in a SQLite database, and rendered in the browser with formatting.

### Core Features

- User authentication (sign up, login, logout) via better-auth
- Authenticated note management (CRUD)
- Rich text editor using TipTap with:
  - Bold, Italic
  - Heading levels (H1–H3) + normal text
  - Inline code + code blocks
  - Bullet lists
  - Horizontal rules
- Public sharing of notes via a public URL (toggle on/off)

### Tech

- Next.js (App Router) + Bun runtime
- TypeScript
- TailwindCSS
- SQLite via Bun's SQLite client with raw SQL

## 2. Architecture

### 2.1 High-Level Architecture

- **Frontend & Backend:** Next.js (App Router)
  - Server components for data fetching
  - Client components for TipTap editor and interactive UI
  - Route Handlers (`app/api/.../route.ts`) for JSON APIs
- **Runtime:** Bun (for dev & production)
- **Database:** Single SQLite file (e.g., `data/app.db`) accessed via Bun's SQLite client
- **Auth:** better-auth integrated into Next.js (middleware + server helpers)

### 2.2 Application Layers

**Presentation layer**
- Next.js pages and components
- TailwindCSS for styling
- TipTap editor component

**API layer**
- REST-like JSON endpoints for notes CRUD & sharing

**Data access layer**
- Raw SQL queries executed via Bun's SQLite client
- A small helper module for DB access

## 3. Functional Requirements

### 3.1 Authentication

Users can:
- Register (email + password, minimum validation)
- Log in / log out

Authentication state is accessible on server (for SSR) and on client (for protected UI).

Unauthenticated users:
- Can access public shared note URLs (read-only)
- Cannot access dashboard or personal notes

### 3.2 Notes Management (Authenticated)

**Create a new note:**
- Default title: "Untitled note"
- Default empty TipTap document

**View a list of own notes:**
- Show title, last updated at, shared status

**View a single note:**
- Load editor with stored TipTap JSON document

**Update note:**
- Change title
- Change content (TipTap JSON)
- Auto-update `updated_at`

**Delete note:**
- Hard delete

### 3.3 Note Sharing

Users can toggle note "public sharing":

**When enabled:**
- Note gets a unique public slug (e.g. `abcdef1234`)
- Accessible via `/p/{slug}` for anonymous users

**When disabled:**
- Public URL returns 404 / "Note not found"

**Public page rendering:**
- Reads note from DB by `public_slug`
- Shows title and content in read-only mode
- No editing or owner information necessary

## 4. Non-Functional Requirements

**Performance**
- Notes list & note view should load under ~300 ms for typical DB sizes

**Security**
- All note operations are scoped to authenticated user's `user_id`
- Public notes are read-only; no leaked private data in API responses

**Reliability**
- Graceful handling of DB errors

**Maintainability**
- Type-safe APIs and DB types
- Modularized DB and auth helpers

**UX**
- Simple, minimal UI with keyboard-friendly editor

## 5. Data Model & Database Schema (SQLite)

### 5.1 Tables

#### Better Auth Core Tables

The following tables are automatically created and managed by the better-auth library. Use the better-auth CLI to initialize or migrate the schema:

```bash
# Generate or migrate the database schema
bunx --bun auth@latest generate
# or
bunx --bun auth@latest migrate
```

##### user

Stores user account information. Created and managed by better-auth.

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for each user (primary key) |
| name | TEXT | User's chosen display name |
| email | TEXT | User's email address for communication and login |
| emailVerified | INTEGER | Whether the user's email is verified (0 = no, 1 = yes) |
| image | TEXT | User's profile image URL (optional) |
| createdAt | TEXT | Timestamp of account creation (ISO 8601 format) |
| updatedAt | TEXT | Timestamp of last user information update (ISO 8601 format) |

##### session

Stores active user sessions and authentication tokens. Automatically managed by better-auth based on session configuration.

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for each session (primary key) |
| userId | TEXT | User ID linked to this session (foreign key) |
| token | TEXT | Unique session token used for authentication |
| expiresAt | TEXT | ISO 8601 timestamp when the session expires |
| ipAddress | TEXT | IP address of the client (optional, for audit/security) |
| userAgent | TEXT | User agent of the browser/client (optional, for device tracking) |
| createdAt | TEXT | Timestamp of session creation (ISO 8601 format) |
| updatedAt | TEXT | Timestamp of last session activity (ISO 8601 format) |

##### account

Stores authentication provider information (credentials, OAuth tokens, etc.). Managed by better-auth for multi-provider support.

```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  idToken TEXT,
  password TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for each account record (primary key) |
| userId | TEXT | User ID this account belongs to (foreign key) |
| accountId | TEXT | Provider-specific account ID (or userId for credential providers) |
| providerId | TEXT | Authentication provider ID (e.g., "credential", "google", "github") |
| accessToken | TEXT | OAuth access token from provider (optional) |
| refreshToken | TEXT | OAuth refresh token from provider (optional) |
| accessTokenExpiresAt | TEXT | ISO 8601 expiry time for access token (optional) |
| refreshTokenExpiresAt | TEXT | ISO 8601 expiry time for refresh token (optional) |
| scope | TEXT | OAuth scopes granted by provider (optional, comma/space-separated) |
| idToken | TEXT | OpenID Connect ID token from provider (optional) |
| password | TEXT | Hashed password for credential provider authentication (optional) |
| createdAt | TEXT | Timestamp of account linking (ISO 8601 format) |
| updatedAt | TEXT | Timestamp of last account update (ISO 8601 format) |

##### verification

Stores verification requests (email verification, password reset tokens, etc.). Used internally by better-auth for verification flows.

```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for this verification request (primary key) |
| identifier | TEXT | Context identifier (e.g., user email, user ID) |
| value | TEXT | The verification value (e.g., OTP code, reset token) |
| expiresAt | TEXT | ISO 8601 timestamp when this verification expires |
| createdAt | TEXT | Timestamp of verification request creation (ISO 8601 format) |
| updatedAt | TEXT | Timestamp of last verification update (ISO 8601 format) |

#### Database Initialization

**SQLite Setup with Bun:**

Initialize better-auth with Bun's built-in SQLite module in your auth configuration file (e.g., `lib/auth.ts`):

```typescript
import { betterAuth } from "better-auth";
import { Database } from "bun:sqlite";

export const auth = betterAuth({
  database: new Database("data/app.db"),
  // ... rest of better-auth config
});
```

**Running CLI Commands:**

When using Bun, prefix auth CLI commands with `bunx --bun` to avoid TypeScript resolution issues:

```bash
bunx --bun auth@latest generate  # Generate schema
bunx --bun auth@latest migrate   # Run migrations
```

#### notes

Application-specific table for storing notes created by authenticated users.

```sql
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  title TEXT NOT NULL,
  contentJson TEXT NOT NULL,
  isPublic INTEGER NOT NULL DEFAULT 0,
  publicSlug TEXT UNIQUE,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);
```

| Field | Type | Description |
|-------|------|-------------|
| id | TEXT | Unique identifier for the note (primary key) |
| userId | TEXT | User ID who owns this note (foreign key) |
| title | TEXT | Note title |
| contentJson | TEXT | Note content as serialized TipTap JSON document |
| isPublic | INTEGER | Whether the note is publicly shared (0 = private, 1 = public) |
| publicSlug | TEXT | Unique slug for public access via `/p/{slug}` (optional, only if public) |
| createdAt | TEXT | Timestamp of note creation (ISO 8601 format) |
| updatedAt | TEXT | Timestamp of last note update (ISO 8601 format) |

### 5.2 Indexes

Create indexes for query performance:

```sql
CREATE INDEX idx_notes_userId ON notes(userId);
CREATE INDEX idx_notes_publicSlug ON notes(publicSlug);
CREATE INDEX idx_notes_isPublic ON notes(isPublic);
```

## 6. Backend: DB & API Layer

### 6.1 Database Access Module

**File:** `lib/db.ts`

Initialize a Bun SQLite client for database operations:

```typescript
import { Database } from "bun:sqlite";

export const db = new Database("data/app.db");
```

Export helper functions:

- `query<T>(sql: string, params?: any[]): T[]` — Executes SELECT and returns all rows
- `get<T>(sql: string, params?: any[]): T | undefined` — Executes SELECT and returns first row
- `run(sql: string, params?: any[]): void` — Executes INSERT/UPDATE/DELETE

**Note:** Use parameterized queries with `?` placeholders to prevent SQL injection.

### 6.2 Note Repository Functions

**File:** `lib/notes.ts`

Provides typed functions for note operations, mapping database rows to TypeScript types.

**TypeScript types:**

```typescript
export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string; // serialized TipTap JSON document
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};
```

**Repository functions:**

- `createNote(userId: string, data?: { title?: string; contentJson?: string }): Promise<Note>` — Creates a new note with optional title and content. Auto-generates ID and timestamps.
- `getNoteById(userId: string, noteId: string): Promise<Note | null>` — Fetches a single note (verifies ownership via userId).
- `getNotesByUser(userId: string): Promise<Note[]>` — Lists all notes owned by the user, sorted by updatedAt descending.
- `updateNote(userId: string, noteId: string, data: Partial<{ title: string; contentJson: string }>): Promise<Note | null>` — Updates title and/or content. Auto-updates `updatedAt`.
- `deleteNote(userId: string, noteId: string): Promise<void>` — Hard-deletes a note by ID.
- `setNotePublic(userId: string, noteId: string, isPublic: boolean): Promise<Note | null>` — Toggles public sharing. Generates random `publicSlug` when enabling, clears it when disabling.
- `getNoteByPublicSlug(slug: string): Promise<Note | null>` — Fetches a public note by slug (no authentication required; only returns if `isPublic = 1`).

**Security note:** All functions enforce `userId = ?` in SQL WHERE clauses to prevent cross-user access.

## 7. API Design (Next.js Route Handlers)

Base path under `/api/notes`.

### 7.1 Authentication Access

Implement a server helper from better-auth like `getCurrentUser()` or `getSession()`.

All `/api/notes` handlers (except public read) must:
- Check auth
- Return 401 if not authenticated

### 7.2 Endpoints

#### GET /api/notes

**Description:** List notes for current user.

**Response 200:**
```json
[
  {
    "id": "note-id",
    "title": "My Note",
    "isPublic": true,
    "updatedAt": "2025-01-01T12:00:00Z"
  }
]
```

Optionally omit `contentJson` for list for performance.

#### POST /api/notes

**Description:** Create a new note.

**Request body (JSON):**
```json
{
  "title": "Optional title",
  "contentJson": { "type": "doc", ... }
}
```

**Behavior:**
- Default title = "Untitled note" if missing
- Default `contentJson` = empty TipTap document if missing

**Response 201:** created Note (or minimal subset)

#### GET /api/notes/:id

**Description:** Get single note owned by current user.

**Response:**
- 200 with full note including `contentJson`
- 404 if not found or not owned by user

#### PUT /api/notes/:id

**Description:** Update note title/content.

**Request body:**
```json
{
  "title": "New title",
  "contentJson": { ... }
}
```

**Response:**
- 200 with updated note
- 404 if not found

#### DELETE /api/notes/:id

**Description:** Delete note.

**Response:**
- 204 on success
- 404 if not found

#### POST /api/notes/:id/share

**Description:** Toggle public sharing on/off.

**Request body:**
```json
{
  "isPublic": true
}
```

**Behavior:**
- If `isPublic = true` and `publicSlug` is null, generate a random slug (16+ chars, e.g., using `nanoid()`)
- If `isPublic = false`, set `isPublic = 0` and `publicSlug = NULL`
- Auto-update `updatedAt` timestamp

**Response 200:**
```json
{
  "id": "note-id",
  "isPublic": true,
  "publicSlug": "abcdef1234ghijkl"
}
```

### 7.3 Public Note Endpoint

#### GET /api/public-notes/:slug

**Description:** Read-only access to public notes via slug. No authentication required.

**Response 200:**
```json
{
  "id": "note-id",
  "title": "Public Note Title",
  "contentJson": { "type": "doc", "content": [...] }
}
```

**Response 404:**
- If slug not found
- If note exists but `isPublic = 0` (private)

**Note:** Alternatively, skip this endpoint and resolve notes directly in the `/p/[slug]` route using Next.js server components with `db.get()`.

## 8. Frontend – Pages & Components

### 8.1 Routes

Assuming Next.js App Router structure:

- `/` – Landing page
  - Marketing / "Log in / Sign up" CTA
- `/dashboard` – Authenticated area
  - List of user notes
  - "Create note" button
- `/notes/[id]` – Authenticated note editor page
  - TipTap editor
  - Title field
  - Share toggle
  - Delete button
- `/p/[slug]` – Public note page
  - Read-only content
  - No nav to user-specific area if viewer is unauthenticated

### 8.2 Layout & Navigation

- Global layout: `app/layout.tsx`
  - Header with app name, login/logout/account & theme
- `app/(auth)/login`, `app/(auth)/register` (if better-auth doesn't provide their own UI)

### 8.3 Components

**components/NoteList.tsx**
- Props: `notes: { id, title, updatedAt, isPublic }[]`
- Renders list with links to `/notes/[id]`

**components/NoteEditor.tsx**
- TipTap-based editor
- Controlled by parent (`onChange` updates state, eventual API call)

**components/ShareToggle.tsx**
- Switch/checkbox for `isPublic`
- Shows public URL when enabled

**components/DeleteNoteButton.tsx**
- Confirms and calls DELETE API

**components/PublicNoteViewer.tsx**
- Render TipTap content in read-only mode (or use `EditorContent` with `editable: false`)

## 9. TipTap Integration

### 9.1 Extensions

Enable at minimum:
- `StarterKit` (with paragraphs, headings, bold, italic, bullet lists, horizontal rule, etc.)
- `Code` (inline code)
- `CodeBlockLowlight` or `CodeBlock` (for code snippets)

**Example editor config:**

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Code,
    CodeBlock
  ],
  content: initialContentJson,  // TipTap JSON
  onUpdate: ({ editor }) => {
    const json = editor.getJSON();
    onChange(json);
  },
});
```

Content is always stored in DB as `JSON.stringify(json)`; when loading, `JSON.parse` and pass as `content`.

### 9.2 Toolbar

Buttons:
- Bold, Italic
- H1, H2, H3, paragraph
- Bullet list
- Inline code
- Code block
- Horizontal rule

Each button calls the relevant TipTap chain: `editor.chain().focus().toggleBold().run()` etc.

## 10. Styling (TailwindCSS)

- Configure Tailwind in `tailwind.config.ts`
- Use a minimal design:
  - Neutral background, card-like note container
  - Utility classes on components
- Consider a prose style for read-only content (using `@tailwindcss/typography`)

## 11. Security Considerations

**Auth enforcement**
- All `/dashboard` and `/notes/[id]` routes check auth on server
- API routes verify user and attach `userId` from session

**Authorization**
- Every note query in the auth context filters by `user_id`

**Public notes**
- Slug should be sufficiently random to prevent guessing (e.g. 16+ chars)

**XSS**
- Primary data is TipTap JSON, not raw HTML
- When rendering to HTML, only use TipTap's rendering (no arbitrary `dangerouslySetInnerHTML` with unsanitized data)

**Rate limiting (optional enhancement)**
- Apply per-IP or per-user rate limiting to API routes if exposed publicly

## 12. Development Workflow

1. Initialize Next.js app with Bun & TypeScript
2. Set up TailwindCSS
3. Integrate better-auth and session handling
4. Implement SQLite DB initialization and migrations (e.g. via a `scripts/init-db.ts` or manual `.sql`)
5. Build DB helpers and note repository
6. Implement `/api/notes` and sharing APIs
7. Build dashboard and note editor pages
8. Integrate TipTap editor and toolbar
9. Implement public note pages `/p/[slug]`
10. Add polish (loading states, toast messages, error handling)
