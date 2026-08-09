'use client';

import { useState } from 'react';
import { deleteNoteAction } from '@/lib/actions/notes';

interface DeleteNoteButtonProps {
  noteId: string;
}

export function DeleteNoteButton({ noteId }: DeleteNoteButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNoteAction(noteId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <>
        <div className='fixed inset-0 bg-black/50' onClick={() => setShowConfirm(false)} />
        <div className='fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-white p-6 shadow-lg'>
          <h2 className='text-lg font-semibold'>Delete note?</h2>
          <p className='mt-2 text-gray-600'>This action cannot be undone.</p>

          <div className='mt-6 flex gap-2'>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className='flex-1 rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100'
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className='flex-1 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400'
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className='rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700'
    >
      Delete
    </button>
  );
}
