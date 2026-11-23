'use client';
import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginForm() {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'register') {
        const response = await fetch('/api/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(values) });
        if (!response.ok) throw new Error((await response.json()).error);
      }
      const result = await signIn('credentials', { email: values.email, password: values.password, redirect: false, redirectTo: '/learn' });
      if (!result?.ok || result.error) throw new Error('Sign-in failed. Check your email and password.');
      window.location.assign('/learn');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  return <>
    <h1 className="mb-4 text-2xl font-bold">{mode === 'login' ? 'Sign in to Study Lab' : 'Create an account'}</h1>
    <form className="grid gap-4" onSubmit={submit}>
      {mode === 'register' && <label className="label">Name<input className="field" name="name" autoComplete="name" required minLength={2} maxLength={70} /></label>}
      <label className="label">Email<input className="field" name="email" type="email" autoComplete="email" required /></label>
      <label className="label">Password<input className="field" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={72} /></label>
      {mode === 'register' && <>
        <label className="label">Student class code (optional)<input className="field" name="classCode" maxLength={24} /></label>
        <label className="label">Teacher invitation code (optional)<input className="field" name="teacherCode" type="password" maxLength={160} /></label>
      </>}
      <button className="action" disabled={busy}>{busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    {message && <p role="alert" className="mt-3 text-sm text-red-800">{message}</p>}
    <button type="button" className="mt-4 text-indigo-800 underline" onClick={() => { setMessage(''); setMode(mode === 'login' ? 'register' : 'login'); }} disabled={busy}>{mode === 'login' ? 'Create an account' : 'Back to sign in'}</button>
  </>;
}
