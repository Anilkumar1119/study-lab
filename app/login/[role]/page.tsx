import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import AccountForm from '../form';

export const metadata = { title: 'Sign in | Study Lab' };

export default async function RoleLoginPage({ params, searchParams }: { params: Promise<{ role: string }>; searchParams: Promise<{ next?: string }> }) {
  const { role } = await params;
  const destination = (await searchParams).next;
  const next = destination === 'chat' ? '/chat' : destination === 'quiz' ? '/quiz' : '/learn';
  if (role !== 'student' && role !== 'teacher') notFound();
  if ((await auth())?.user) redirect(next);
  return <section className="panel mx-auto mt-4 max-w-md sm:mt-10 sm:p-8"><AccountForm mode={role} next={next} /></section>;
}
