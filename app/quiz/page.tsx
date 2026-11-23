import { actor } from '@/auth';
import { redirect } from 'next/navigation';
import Quiz from './workspace';

export const metadata = { title: 'Adaptive Quiz | Study Lab' };

export default async function QuizPage({searchParams}: {searchParams: Promise<{topic?: string; subject?: string}>}) {
  const user = await actor();
  if (!user) redirect('/login?next=quiz');
  if (user.role !== 'student') return <p className="panel mx-auto max-w-xl">Adaptive quizzes are available with a student account.</p>;
  const {topic, subject} = await searchParams;
  return <Quiz initialTopic={typeof topic === 'string' ? topic.slice(0,100) : ''} initialSubject={typeof subject === 'string' ? subject.slice(0,100) : ''} />;
}
