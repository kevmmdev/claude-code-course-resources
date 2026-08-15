import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { SignOutButton } from '@/components/SignOutButton';
import { PageContainer } from '@/components/PageContainer';

export async function Header() {
  const session = await getSession();

  return (
    <header className='border-b bg-white'>
      <PageContainer className='flex items-center justify-between py-4'>
        <Link href='/dashboard' className='text-xl font-bold text-gray-900 hover:text-gray-700'>
          NextNotes
        </Link>
        {session?.user && <SignOutButton />}
      </PageContainer>
    </header>
  );
}
