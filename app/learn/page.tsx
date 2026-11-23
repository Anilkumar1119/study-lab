import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import Workspace from './workspace';

export default async function LearnPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-3xl font-extrabold tracking-tight">Learning workspace</h1><p className="text-slate-600">{session.user.name}</p></div>
      <form action={async()=>{'use server';await signOut({redirectTo:'/'});}}><button className="secondary">Sign out</button></form>
    </div>
    <Workspace />
  </>;
}
