import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import StudyChat from './workspace';

export const metadata = { title: 'Study Chat | Study Lab' };

export default async function ChatPage() {
  if (!(await auth())?.user) redirect('/login?next=chat');
  return <StudyChat />;
}
