'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { JSONContent } from '@tiptap/react';
import type { Note } from '@/lib/notes';
import { RichTextEditor } from '@/components/RichTextEditor';
import { parseNoteContent } from '@/lib/tiptap';
import { updateNoteAction, deleteNoteAction, toggleShareAction } from '@/lib/actions/notes';

interface NoteEditorProps {
  note: Note;
}

export function NoteEditor({ note }: NoteEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<JSONContent>(() => parseNoteContent(note.contentJson));
  const [isPublic, setIsPublic] = useState(note.isPublic);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(
    note.isPublic ? `/p/${note.publicSlug}` : null,
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateNoteAction(note.id, { title, contentJson: JSON.stringify(content) });
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const performToggleShare = async () => {
    setSharing(true);
    try {
      const updated = await toggleShareAction(note.id, !isPublic);
      setIsPublic(!isPublic);
      if (updated.isPublic) {
        setPublicUrl(`/p/${updated.publicSlug}`);
      } else {
        setPublicUrl(null);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle share');
    } finally {
      setSharing(false);
    }
  };

  const handleToggleShare = () => {
    if (isPublic) {
      performToggleShare();
    } else {
      setShowShareConfirm(true);
    }
  };

  const handleConfirmShare = () => {
    setShowShareConfirm(false);
    performToggleShare();
  };

  const handleCancelShare = () => {
    setShowShareConfirm(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNoteAction(note.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='border-b bg-white'>
        <div className='mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link href={`/notes/${note.id}`} className='text-purple-700 hover:text-purple-800'>
              ← Back
            </Link>
            <h1 className='flex-1 text-xl font-bold'>Edit Note</h1>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='space-y-6 rounded-md border border-gray-200 bg-white p-6'>
          <div>
            <label className='block text-sm font-medium'>Title</label>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className='mt-2 block w-full rounded-md border border-gray-300 px-3 py-2'
            />
          </div>

          <div>
            <label className='block text-sm font-medium'>Content</label>
            <div className='mt-2'>
              <RichTextEditor initialContent={content} onChange={setContent} />
            </div>
          </div>

          <div className='flex gap-4'>
            <button
              onClick={handleSave}
              disabled={saving}
              className='rounded-md bg-purple-700 px-4 py-2 text-white hover:bg-purple-800 disabled:bg-gray-400'
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleToggleShare}
              disabled={sharing}
              className='rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:bg-gray-400'
            >
              {sharing ? 'Updating...' : isPublic ? 'Unshare' : 'Share'}
            </button>

            <button
              onClick={handleDelete}
              className='rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700'
            >
              Delete
            </button>
          </div>

          {publicUrl && (
            <div className='rounded-md bg-green-50 p-4'>
              <p className='text-sm text-green-800'>
                Public URL: <code className='break-all'>{publicUrl}</code>
              </p>
            </div>
          )}
        </div>
      </main>

      {showShareConfirm && (
        <>
          <div className='fixed inset-0 bg-black/50' onClick={handleCancelShare} />
          <div className='fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg'>
            <h2 className='text-lg font-semibold'>Make this note public?</h2>
            <p className='mt-2 text-gray-600'>
              Anyone with the link will be able to view this note.
            </p>

            <div className='mt-6 flex gap-2'>
              <button
                onClick={handleCancelShare}
                disabled={sharing}
                className='flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100'
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShare}
                disabled={sharing}
                className='flex-1 rounded-md bg-purple-700 px-4 py-2 text-white hover:bg-purple-800 disabled:bg-gray-400'
              >
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
