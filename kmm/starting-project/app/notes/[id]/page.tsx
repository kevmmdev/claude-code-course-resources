import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getNoteById } from '@/lib/notes';
import { parseNoteContent } from '@/lib/tiptap';
import { NoteContentRenderer } from '@/components/NoteContentRenderer';
import { DeleteNoteButton } from '@/components/DeleteNoteButton';

interface NoteViewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NoteViewPage({ params }: NoteViewPageProps) {
  const { id } = await params;
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/authenticate');
  }

  const note = await getNoteById(session.user.id, id);

  if (!note) {
    notFound();
  }

  const content = parseNoteContent(note.contentJson);

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='border-b bg-white'>
        <div className='mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link href='/dashboard' className='text-blue-600 hover:text-blue-700'>
              ← Back
            </Link>
            <div className='flex-1'>
              <h1 className='text-xl font-bold'>{note.title}</h1>
            </div>
            {note.isPublic && (
              <span className='rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800'>
                Public
              </span>
            )}
            <Link
              href={`/notes/${note.id}/edit`}
              className='rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
            >
              Edit
            </Link>
            <DeleteNoteButton noteId={note.id} />
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='rounded-md border border-gray-200 bg-white p-6'>
          <NoteContentRenderer content={content} />
        </div>
      </main>
    </div>
  );
}
