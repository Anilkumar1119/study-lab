import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = { title: 'Study Lab', description: 'Discover resources, learn by teaching, and review what you know.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight"><span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-indigo-700 text-white">S</span>Study Lab</Link>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
          <Link href="/">Resources</Link><Link href="/chat">Study Chat</Link><Link href="/quiz">Adaptive Quiz</Link><Link href="/learn">Teach-back and progress</Link><Link href="/login" className="text-indigo-800">Sign in</Link><a href="https://algebra-tutor-lab.bigzebu.chatgpt.site/#practice">Algebra tutor</a>
        </div>
      </nav>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">{children}</main>
  </body></html>;
}
