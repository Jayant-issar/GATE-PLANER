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
  { name: 'Mistake Notebook', href: '/mistakes', icon: BookOpen },
  { name: 'Syllabus', href: '/syllabus', icon: Layers },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-indigo-600">GATE CS Planner</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                  isActive
                    ? 'text-indigo-600'
                    : 'text-slate-400 group-hover:text-indigo-600'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{session?.user?.name || 'Student'}</p>
              <p className="text-xs font-medium text-slate-500 truncate max-w-[140px]">{session?.user?.email || 'Target: GATE 2027'}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
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
