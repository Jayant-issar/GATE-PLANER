'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  CalendarDays,
  Video,
  FileQuestion,
  FileText,
  Repeat,
  BarChart3,
  BookOpen,
  Settings,
  Timer,
  Layers,
  LogOut,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Weekly Planner', href: '/weekly-planner', icon: CalendarDays },
  { name: 'Lectures', href: '/lectures', icon: Video },
  { name: 'PYQs', href: '/pyqs', icon: FileQuestion },
  { name: 'Mock Tests', href: '/mock-tests', icon: FileText },
  { name: 'Revision', href: '/revision', icon: Repeat },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Study Sessions', href: '/study-sessions', icon: Timer },
  { name: 'Mistake Notebook', href: '/mistakes', icon: BookOpen },
  { name: 'Syllabus', href: '/syllabus', icon: Layers },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="lofi-panel m-4 flex h-[calc(100%-2rem)] w-72 flex-col overflow-hidden rounded-[2rem]">
      <div className="border-b border-white/70 px-6 py-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white">
          Lofi Planner
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">GATE CS Planner</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Anime-night focus room for planning, revision, and long study loops.
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-[1rem] px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                  : 'text-slate-700 hover:bg-white/75 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive
                    ? 'text-amber-200'
                    : 'text-slate-400 group-hover:text-slate-700'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/70 p-4">
        <div className="rounded-[1.4rem] bg-white/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[170px]">{session?.user?.name || 'Student'}</p>
              <p className="text-xs font-medium text-slate-500 truncate max-w-[170px]">{session?.user?.email || 'Target: GATE 2027'}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
