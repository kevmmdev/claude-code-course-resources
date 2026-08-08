'use client';

import { useRef, useState } from 'react';
import { deleteNoteAction } from '@/lib/actions/notes';

interface DeleteNoteButtonProps {
  noteId: string;
}

export function DeleteNoteButton({ noteId }: DeleteNoteButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [deleting, setDeleting] = useState(false);

  const handleOpenDialog = () => {
    dialogRef.current?.showModal();
  };

  const handleCancel = () => {
    dialogRef.current?.close();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNoteAction(noteId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenDialog}
        className='rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700'
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className='rounded-lg border border-gray-200 p-6 shadow-lg backdrop:bg-black/50'
      >
        <h2 className='text-lg font-semibold'>Delete note?</h2>
        <p className='mt-2 text-gray-600'>This action cannot be undone.</p>

        <div className='mt-6 flex gap-2'>
          <button
            onClick={handleCancel}
            disabled={deleting}
            className='rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100'
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className='rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400'
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </dialog>
    </>
  );
}
