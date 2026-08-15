import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getNoteByPublicSlug } from '@/lib/notes';
import { parseNoteContent } from '@/lib/tiptap';
import { PublicNoteViewer } from '@/components/PublicNoteViewer';

interface PublicNotePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const { slug } = await params;
  const note = await getNoteByPublicSlug(slug);

  if (!note) {
    notFound();
  }

  const content = parseNoteContent(note.contentJson);

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='border-b bg-white'>
        <div className='mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-4'>
            <Link href='/' className='text-purple-700 hover:text-purple-800'>
              ← Home
            </Link>
            <h1 className='flex-1 text-xl font-bold'>{note.title}</h1>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='rounded-md border border-gray-200 bg-white p-6'>
          <PublicNoteViewer content={content} />
        </div>
      </main>
    </div>
  );
}
