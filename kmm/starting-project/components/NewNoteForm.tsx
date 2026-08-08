'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { JSONContent } from '@tiptap/react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { createNoteWithContentAction } from '@/lib/actions/notes';

export function NewNoteForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<JSONContent>({ type: 'doc', content: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createNoteWithContentAction({
        title: title || undefined,
        contentJson: JSON.stringify(content),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='border-b bg-white'>
        <div className='mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link href='/dashboard' className='text-blue-600 hover:text-blue-700'>
              ← Back
            </Link>
            <h1 className='flex-1 text-xl font-bold'>New Note</h1>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        <form
          onSubmit={handleSubmit}
          className='space-y-6 rounded-md border border-gray-200 bg-white p-6'
        >
          {error && <div className='rounded-md bg-red-50 p-4 text-sm text-red-800'>{error}</div>}

          <div>
            <label htmlFor='title' className='block text-sm font-medium'>
              Title
            </label>
            <input
              id='title'
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Untitled note'
              className='mt-2 block w-full rounded-md border border-gray-300 px-3 py-2'
            />
          </div>

          <div>
            <label className='block text-sm font-medium'>Content</label>
            <div className='mt-2'>
              <RichTextEditor onChange={setContent} />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400'
          >
            {loading ? 'Creating...' : 'Create note'}
          </button>
        </form>
      </main>
    </div>
  );
}
