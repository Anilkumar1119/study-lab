import Link from 'next/link';
import Resources from './resources';

export default function Home() {
  return <>
    <section className="rounded-3xl bg-[#19264f] px-7 py-9 text-white sm:px-10">
      <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">Find a resource. Teach it back.</h1>
      <p className="mt-3 max-w-2xl text-indigo-100">Explore any subject, then explain what you learned and practice the concepts that need another review.</p>
      <Link href="/learn" className="mt-5 inline-block rounded-lg bg-white px-4 py-2 font-semibold text-indigo-900">Open teach-back →</Link>
    </section>
    <Resources />
  </>;
}
