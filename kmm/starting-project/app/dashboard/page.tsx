import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getNotesByUser } from '@/lib/notes';
import { PageContainer } from '@/components/PageContainer';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/authenticate');
  }

  const notes = await getNotesByUser(session.user.id);

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='border-b bg-white'>
        <PageContainer className='py-6'>
          <h1 className='text-3xl font-bold'>Notes</h1>
        </PageContainer>
      </header>

      <PageContainer as='main' className='py-8'>
        <div className='mb-8'>
          <Link
            href='/notes/new'
            className='inline-block rounded-md bg-purple-700 px-4 py-2 text-white hover:bg-purple-800'
          >
            New note
          </Link>
        </div>

        {notes.length === 0 ? (
          <p className='text-gray-500'>No notes yet. Create one to get started.</p>
        ) : (
          <div className='space-y-2'>
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className='block rounded-md border border-gray-200 bg-white p-4 hover:shadow-md'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-semibold'>{note.title}</h3>
                    <p className='text-sm text-gray-500'>
                      {new Date(note.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {note.isPublic && (
                    <span className='rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800'>
                      Public
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
