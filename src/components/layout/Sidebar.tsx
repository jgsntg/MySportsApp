'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Newspaper, Trophy, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/teams', label: 'Browse Teams', icon: Trophy },
  { href: '/headlines', label: 'Headlines', icon: Newspaper },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <nav className="flex flex-col gap-1 p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
        Navigation
      </p>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 fixed left-0 top-16 bottom-0 bg-slate-900 border-r border-slate-800 overflow-y-auto">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
              <span className="text-lg font-extrabold text-white">
                My<span className="text-blue-500">Sports</span>
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
