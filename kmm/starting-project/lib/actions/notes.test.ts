import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as actions from './notes';

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/notes', () => ({
  createNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  setNotePublic: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { getSession } from '@/lib/auth';
import { createNote, updateNote, deleteNote, setNotePublic } from '@/lib/notes';
import { redirect } from 'next/navigation';

describe('Server actions', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'user@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNoteWithContentAction', () => {
    it('throws when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      await expect(actions.createNoteWithContentAction({})).rejects.toThrow('Unauthorized');
    });

    it('throws when session has no user', async () => {
      vi.mocked(getSession).mockResolvedValue({ user: null });

      await expect(actions.createNoteWithContentAction({})).rejects.toThrow('Unauthorized');
    });

    it('creates note and redirects on success', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);
      const validJson = JSON.stringify({ type: 'doc', content: [] });
      vi.mocked(createNote).mockResolvedValue({
        id: 'note-456',
        userId: 'user-123',
        title: 'Test Note',
        contentJson: validJson,
        isPublic: false,
        publicSlug: null,
        createdAt: '2025-01-01T00:00:00',
        updatedAt: '2025-01-01T00:00:00',
      });

      await actions.createNoteWithContentAction({
        title: 'Test Note',
        contentJson: validJson,
      });

      expect(createNote).toHaveBeenCalledWith('user-123', {
        title: 'Test Note',
        contentJson: validJson,
      });
      expect(redirect).toHaveBeenCalledWith('/notes/note-456');
    });

    it('creates note with defaults when data is empty', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(createNote).mockResolvedValue({
        id: 'note-789',
        userId: 'user-123',
        title: 'Untitled note',
        contentJson: '{"type":"doc","content":[]}',
        isPublic: false,
        publicSlug: null,
        createdAt: '2025-01-01T00:00:00',
        updatedAt: '2025-01-01T00:00:00',
      });

      await actions.createNoteWithContentAction({});

      expect(createNote).toHaveBeenCalledWith('user-123', {});
      expect(redirect).toHaveBeenCalledWith('/notes/note-789');
    });

    it('rejects invalid data', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      await expect(
        actions.createNoteWithContentAction({
          title: '', // empty title
        }),
      ).rejects.toThrow();
    });

    it('rejects oversized content', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      const hugeJson = JSON.stringify({
        type: 'doc',
        content: [{ type: 'text', text: 'a'.repeat(500_001) }],
      });

      await expect(
        actions.createNoteWithContentAction({
          contentJson: hugeJson,
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateNoteAction', () => {
    it('throws when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      await expect(actions.updateNoteAction('note-123', {})).rejects.toThrow('Unauthorized');
    });

    it('updates note and returns it', async () => {
      const updatedNote = {
        id: 'note-123',
        userId: 'user-123',
        title: 'Updated',
        contentJson: '{}',
        isPublic: false,
        publicSlug: null,
        createdAt: '2025-01-01T00:00:00',
        updatedAt: '2025-01-02T00:00:00',
      };
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(updateNote).mockResolvedValue(updatedNote);

      const result = await actions.updateNoteAction('note-123', {
        title: 'Updated',
      });

      expect(updateNote).toHaveBeenCalledWith('user-123', 'note-123', {
        title: 'Updated',
      });
      expect(result).toEqual(updatedNote);
    });

    it('throws when note not found or not owned', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(updateNote).mockResolvedValue(null);

      await expect(actions.updateNoteAction('nonexistent', { title: 'Title' })).rejects.toThrow(
        'Note not found or not owned by user',
      );
    });

    it('rejects invalid title', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      await expect(
        actions.updateNoteAction('note-123', {
          title: 'a'.repeat(501), // too long
        }),
      ).rejects.toThrow();
    });

    it('rejects invalid content JSON', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);

      await expect(
        actions.updateNoteAction('note-123', {
          contentJson: '{broken json}',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteNoteAction', () => {
    it('throws when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      await expect(actions.deleteNoteAction('note-123')).rejects.toThrow('Unauthorized');
    });

    it('deletes note and redirects to dashboard', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(deleteNote).mockResolvedValue(undefined);

      await actions.deleteNoteAction('note-123');

      expect(deleteNote).toHaveBeenCalledWith('user-123', 'note-123');
      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });

    it('always redirects even if delete fails silently', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(deleteNote).mockResolvedValue(undefined);

      await actions.deleteNoteAction('nonexistent');

      expect(redirect).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('toggleShareAction', () => {
    it('throws when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      await expect(actions.toggleShareAction('note-123', true)).rejects.toThrow('Unauthorized');
    });

    it('makes note public and returns updated note', async () => {
      const publicNote = {
        id: 'note-123',
        userId: 'user-123',
        title: 'Public Note',
        contentJson: '{}',
        isPublic: true,
        publicSlug: 'pub-slug-123',
        createdAt: '2025-01-01T00:00:00',
        updatedAt: '2025-01-02T00:00:00',
      };
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(setNotePublic).mockResolvedValue(publicNote);

      const result = await actions.toggleShareAction('note-123', true);

      expect(setNotePublic).toHaveBeenCalledWith('user-123', 'note-123', true);
      expect(result).toEqual(publicNote);
      expect(result.isPublic).toBe(true);
    });

    it('makes note private and returns updated note', async () => {
      const privateNote = {
        id: 'note-123',
        userId: 'user-123',
        title: 'Private Note',
        contentJson: '{}',
        isPublic: false,
        publicSlug: null,
        createdAt: '2025-01-01T00:00:00',
        updatedAt: '2025-01-02T00:00:00',
      };
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(setNotePublic).mockResolvedValue(privateNote);

      const result = await actions.toggleShareAction('note-123', false);

      expect(setNotePublic).toHaveBeenCalledWith('user-123', 'note-123', false);
      expect(result.isPublic).toBe(false);
    });

    it('throws when note not found or not owned', async () => {
      vi.mocked(getSession).mockResolvedValue(mockSession);
      vi.mocked(setNotePublic).mockResolvedValue(null);

      await expect(actions.toggleShareAction('nonexistent', true)).rejects.toThrow(
        'Note not found or not owned by user',
      );
    });
  });
});
