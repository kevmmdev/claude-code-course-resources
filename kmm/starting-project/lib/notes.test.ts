import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as notes from './notes';

vi.mock('./db', () => ({
  query: vi.fn(),
  get: vi.fn(),
  run: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn((length) => `slug-${'a'.repeat(length - 5)}`),
}));

import { query, get, run } from './db';
import { nanoid } from 'nanoid';

describe('Note repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNote', () => {
    it('creates note with defaults when data is empty', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Untitled note',
        content_json: '{"type":"doc","content":[]}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.createNote('user-1');

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notes'),
        expect.arrayContaining(['user-1', 'Untitled note', '{"type":"doc","content":[]}']),
      );
      expect(result.title).toBe('Untitled note');
      expect(result.contentJson).toBe('{"type":"doc","content":[]}');
    });

    it('creates note with custom title and content', async () => {
      const row = {
        id: 'note-456',
        user_id: 'user-1',
        title: 'My Note',
        content_json:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.createNote('user-1', {
        title: 'My Note',
        contentJson:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}',
      });

      expect(result.title).toBe('My Note');
      expect(result.userId).toBe('user-1');
    });

    it('throws when insert returns no row', async () => {
      vi.mocked(get).mockReturnValue(undefined);

      await expect(notes.createNote('user-1')).rejects.toThrow('Failed to create note');
    });
  });

  describe('getNoteById', () => {
    it('returns note when found and owned by user', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'My Note',
        content_json: '{}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.getNoteById('user-1', 'note-123');

      expect(get).toHaveBeenCalledWith(expect.stringContaining('WHERE id = ? AND user_id = ?'), [
        'note-123',
        'user-1',
      ]);
      expect(result).toEqual(expect.objectContaining({ id: 'note-123', userId: 'user-1' }));
    });

    it('returns null when note not found', async () => {
      vi.mocked(get).mockReturnValue(undefined);

      const result = await notes.getNoteById('user-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getNotesByUser', () => {
    it('returns all notes for user ordered by updated_at DESC', async () => {
      const rows = [
        {
          id: 'note-1',
          user_id: 'user-1',
          title: 'Recent',
          content_json: '{}',
          is_public: 0,
          public_slug: null,
          created_at: '2025-01-01T00:00:00',
          updated_at: '2025-01-02T00:00:00',
        },
        {
          id: 'note-2',
          user_id: 'user-1',
          title: 'Older',
          content_json: '{}',
          is_public: 0,
          public_slug: null,
          created_at: '2025-01-01T00:00:00',
          updated_at: '2025-01-01T00:00:00',
        },
      ];
      vi.mocked(query).mockReturnValue(rows);

      const result = await notes.getNotesByUser('user-1');

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = ? ORDER BY updated_at DESC'),
        ['user-1'],
      );
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Recent');
    });

    it('returns empty array when user has no notes', async () => {
      vi.mocked(query).mockReturnValue([]);

      const result = await notes.getNotesByUser('user-no-notes');

      expect(result).toEqual([]);
    });
  });

  describe('updateNote', () => {
    it('updates title only', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Updated Title',
        content_json: '{}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-02T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.updateNote('user-1', 'note-123', { title: 'Updated Title' });

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('SET title = ?'),
        expect.arrayContaining(['Updated Title']),
      );
      expect(result?.title).toBe('Updated Title');
    });

    it('updates content only', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Title',
        content_json: '{"type":"doc","content":[]}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-02T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.updateNote('user-1', 'note-123', {
        contentJson: '{"type":"doc","content":[]}',
      });

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('SET content_json = ?'),
        expect.arrayContaining(['{"type":"doc","content":[]}']),
      );
      expect(result?.contentJson).toBe('{"type":"doc","content":[]}');
    });

    it('updates both title and content', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'New Title',
        content_json: '{"type":"doc","content":[]}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-02T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      await notes.updateNote('user-1', 'note-123', {
        title: 'New Title',
        contentJson: '{"type":"doc","content":[]}',
      });

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('SET title = ?, content_json = ?'),
        expect.anything(),
      );
    });

    it('returns result of getNoteById when no fields to update', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Title',
        content_json: '{}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      await notes.updateNote('user-1', 'note-123', {});

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notes WHERE id = ? AND user_id = ?'),
        ['note-123', 'user-1'],
      );
    });

    it('returns null when note not found or not owned by user', async () => {
      vi.mocked(get).mockReturnValue(undefined);

      const result = await notes.updateNote('user-1', 'nonexistent', { title: 'Title' });

      expect(result).toBeNull();
    });
  });

  describe('deleteNote', () => {
    it('calls run with correct SQL and params', async () => {
      await notes.deleteNote('user-1', 'note-123');

      expect(run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM notes WHERE id = ? AND user_id = ?'),
        ['note-123', 'user-1'],
      );
    });
  });

  describe('setNotePublic', () => {
    it('generates new slug when making note public without existing slug', async () => {
      const currentNote = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Title',
        content_json: '{}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };

      const updatedNote = {
        ...currentNote,
        is_public: 1,
        public_slug: 'slug-aaaaaaaaaaa',
      };

      vi.mocked(get).mockReturnValueOnce(currentNote).mockReturnValueOnce(updatedNote);

      const result = await notes.setNotePublic('user-1', 'note-123', true);

      expect(nanoid).toHaveBeenCalledWith(16);
      expect(get).toHaveBeenLastCalledWith(
        expect.stringContaining('UPDATE notes SET is_public = 1, public_slug = ?'),
        ['slug-aaaaaaaaaaa', 'note-123', 'user-1'],
      );
      expect(result?.isPublic).toBe(true);
      expect(result?.publicSlug).toBe('slug-aaaaaaaaaaa');
    });

    it('reuses existing slug when making note public again', async () => {
      const currentNote = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Title',
        content_json: '{}',
        is_public: 0,
        public_slug: 'existing-slug',
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };

      const updatedNote = {
        ...currentNote,
        is_public: 1,
      };

      vi.mocked(get).mockReturnValueOnce(currentNote).mockReturnValueOnce(updatedNote);

      const result = await notes.setNotePublic('user-1', 'note-123', true);

      expect(nanoid).not.toHaveBeenCalled();
      expect(get).toHaveBeenLastCalledWith(
        expect.stringContaining('UPDATE notes SET is_public = 1, public_slug = ?'),
        ['existing-slug', 'note-123', 'user-1'],
      );
      expect(result?.publicSlug).toBe('existing-slug');
    });

    it('clears is_public and public_slug when making private', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Title',
        content_json: '{}',
        is_public: 0,
        public_slug: null,
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.setNotePublic('user-1', 'note-123', false);

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notes SET is_public = 0, public_slug = NULL'),
        ['note-123', 'user-1'],
      );
      expect(result?.isPublic).toBe(false);
      expect(result?.publicSlug).toBeNull();
    });

    it('returns null when note not found', async () => {
      vi.mocked(get).mockReturnValue(undefined);

      const result = await notes.setNotePublic('user-1', 'nonexistent', true);

      expect(result).toBeNull();
    });
  });

  describe('getNoteByPublicSlug', () => {
    it('returns public note by slug', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Public Note',
        content_json: '{}',
        is_public: 1,
        public_slug: 'public-slug-123',
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.getNoteByPublicSlug('public-slug-123');

      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('WHERE public_slug = ? AND is_public = 1'),
        ['public-slug-123'],
      );
      expect(result?.id).toBe('note-123');
    });

    it('returns null when slug not found', async () => {
      vi.mocked(get).mockReturnValue(undefined);

      const result = await notes.getNoteByPublicSlug('nonexistent-slug');

      expect(result).toBeNull();
    });

    it('returns null when note is not public', async () => {
      vi.mocked(get).mockReturnValue(undefined);

      const result = await notes.getNoteByPublicSlug('private-slug');

      expect(get).toHaveBeenCalledWith(expect.stringContaining('is_public = 1'), ['private-slug']);
      expect(result).toBeNull();
    });

    it('does not filter by user_id (public read path)', async () => {
      const row = {
        id: 'note-456',
        user_id: 'other-user',
        title: 'Public Note from Other User',
        content_json: '{}',
        is_public: 1,
        public_slug: 'shared-slug',
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.getNoteByPublicSlug('shared-slug');

      const callArgs = vi.mocked(get).mock.calls[0][1] as string[];
      expect(callArgs).not.toContain('user-1');
      expect(result?.userId).toBe('other-user');
    });
  });

  describe('toNote mapping', () => {
    it('correctly converts row to camelCase and 0/1 to boolean', async () => {
      const row = {
        id: 'note-123',
        user_id: 'user-1',
        title: 'Title',
        content_json: '{}',
        is_public: 1,
        public_slug: 'slug-123',
        created_at: '2025-01-01T00:00:00',
        updated_at: '2025-01-01T00:00:00',
      };
      vi.mocked(get).mockReturnValue(row);

      const result = await notes.getNoteById('user-1', 'note-123');

      expect(result).toEqual({
        id: 'note-123',
        userId: 'user-1',
        title: 'Title',
        contentJson: '{}',
        isPublic: true,
        publicSlug: 'slug-123',
        createdAt: '2025-01-01T00:00:00',
        updatedAt: '2025-01-01T00:00:00',
      });
    });
  });
});
