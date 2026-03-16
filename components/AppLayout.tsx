'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Providers } from '@/components/Providers';
import { Toaster } from './ui/sonner';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return (
      <Providers>
        {children}
        <Toaster />
      </Providers>
    );
  }

  return (
    <Providers>
      <div className="lofi-shell flex h-full">
        <Sidebar />
        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 lofi-grid opacity-40" />
          <div className="relative min-h-full p-6 sm:p-8">
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    </Providers>
  );
}
