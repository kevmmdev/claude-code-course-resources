import { nanoid } from "nanoid";
import { query, get, run } from "./db";

export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  is_public: 0 | 1;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contentJson: row.content_json,
    isPublic: row.is_public === 1,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createNote(
  userId: string,
  data: { title?: string; contentJson?: string } = {},
): Promise<Note> {
  const id = crypto.randomUUID();
  const title = data.title || "Untitled note";
  const contentJson = data.contentJson || JSON.stringify({ type: "doc", content: [] });

  const row = get<NoteRow>(
    `INSERT INTO notes (id, user_id, title, content_json) VALUES (?, ?, ?, ?) RETURNING *`,
    [id, userId, title, contentJson],
  );

  if (!row) throw new Error("Failed to create note");
  return toNote(row);
}

export async function getNoteById(userId: string, noteId: string): Promise<Note | null> {
  const row = get<NoteRow>(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
  return row ? toNote(row) : null;
}

export async function getNotesByUser(userId: string): Promise<Note[]> {
  const rows = query<NoteRow>(
    `SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId],
  );
  return rows.map(toNote);
}

export async function updateNote(
  userId: string,
  noteId: string,
  data: Partial<{ title: string; contentJson: string }>,
): Promise<Note | null> {
  const setClauses: string[] = [];
  const params: (string | number | null)[] = [];

  if ("title" in data && data.title !== undefined) {
    setClauses.push("title = ?");
    params.push(data.title);
  }

  if ("contentJson" in data && data.contentJson !== undefined) {
    setClauses.push("content_json = ?");
    params.push(data.contentJson);
  }

  if (setClauses.length === 0) return getNoteById(userId, noteId);

  setClauses.push("updated_at = datetime('now')");
  params.push(noteId, userId);

  const sql = `UPDATE notes SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ? RETURNING *`;
  const row = get<NoteRow>(sql, params);

  return row ? toNote(row) : null;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
}

export async function setNotePublic(
  userId: string,
  noteId: string,
  isPublic: boolean,
): Promise<Note | null> {
  if (isPublic) {
    const current = await getNoteById(userId, noteId);
    if (!current) return null;

    const slug = current.publicSlug || nanoid(16);

    const row = get<NoteRow>(
      `UPDATE notes SET is_public = 1, public_slug = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING *`,
      [slug, noteId, userId],
    );

    return row ? toNote(row) : null;
  } else {
    const row = get<NoteRow>(
      `UPDATE notes SET is_public = 0, public_slug = NULL, updated_at = datetime('now') WHERE id = ? AND user_id = ? RETURNING *`,
      [noteId, userId],
    );

    return row ? toNote(row) : null;
  }
}

export async function getNoteByPublicSlug(slug: string): Promise<Note | null> {
  // Public read path: intentionally not scoped by user_id
  const row = get<NoteRow>(
    `SELECT * FROM notes WHERE public_slug = ? AND is_public = 1`,
    [slug],
  );
  return row ? toNote(row) : null;
}
