import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AccountForm from '../login/form';

export const metadata = { title: 'Create an account | Study Lab' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const destination = (await searchParams).next;
  const next = destination === 'chat' ? '/chat' : destination === 'quiz' ? '/quiz' : '/learn';
  if ((await auth())?.user) redirect(next);
  return <section className="panel mx-auto mt-4 max-w-md sm:mt-10 sm:p-8"><AccountForm mode="register" next={next} /></section>;
}
