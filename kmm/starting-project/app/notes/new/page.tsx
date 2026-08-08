import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { NewNoteForm } from '@/components/NewNoteForm';

export default async function NewNotePage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/authenticate');
  }

  return <NewNoteForm />;
}
