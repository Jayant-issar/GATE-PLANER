'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(253,230,138,0.35),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.24),_transparent_22%),linear-gradient(180deg,_#fffaf3,_#f1f7ff_58%,_#eefbf4)]" />
      <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-emerald-200/35 blur-3xl" />
      <div className="lofi-panel relative w-full max-w-md space-y-8 rounded-[2rem] p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 shadow-lg shadow-slate-900/15">
            <BookOpen className="h-6 w-6 text-amber-200" />
          </div>
          <div className="mt-4 inline-flex rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
            New Study Room
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Create an account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Or{' '}
            <Link href="/login" className="font-medium text-slate-900 hover:text-slate-700">
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="sr-only" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="lofi-input relative block w-full rounded-[1rem] px-4 py-3 text-slate-900 placeholder-slate-400 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="email-address">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="lofi-input relative block w-full rounded-[1rem] px-4 py-3 text-slate-900 placeholder-slate-400 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="sr-only" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="lofi-input relative block w-full rounded-[1rem] px-4 py-3 text-slate-900 placeholder-slate-400 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="lofi-button group relative flex w-full justify-center rounded-[1rem] border border-transparent px-4 py-3 text-sm font-medium text-white disabled:opacity-70"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
