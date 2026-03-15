'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, AlertCircle } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function LoginPage() {
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
      await toast.promise(
        (async () => {
          const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });

          if (res?.error) {
            throw new Error('Invalid email or password');
          }

          return res;
        })(),
        {
          loading: 'Signing you in...',
          success: 'Signed in successfully',
          error: 'Invalid email or password',
        }
      );

      router.push('/');
      router.refresh();
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(253,230,138,0.35),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(125,211,252,0.24),_transparent_22%),linear-gradient(180deg,_#fffaf3,_#f1f7ff_58%,_#eefbf4)]" />
      <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-sky-200/35 blur-3xl" />
      <div className="lofi-panel relative w-full max-w-md space-y-8 rounded-[2rem] p-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 shadow-lg shadow-slate-900/15">
            <BookOpen className="h-6 w-6 text-amber-200" />
          </div>
          <div className="mt-4 inline-flex rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
            Lofi Login
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Or{' '}
            <Link href="/register" className="font-medium text-slate-900 hover:text-slate-700">
              create a new account
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
                autoComplete="current-password"
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
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
