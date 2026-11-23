import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import LoginForm from './form';

export default async function LoginPage() {
  if ((await auth())?.user) redirect('/learn');
  return <section className="mx-auto max-w-md panel"><LoginForm /></section>;
}
