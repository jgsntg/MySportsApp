'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Trophy, Newspaper, BarChart2, Gamepad2, Users, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/scoreboard', label: 'Scoreboard',   icon: BarChart2 },
  { href: '/fantasy',    label: 'Fantasy',      icon: Gamepad2 },
  { href: '/players',    label: 'My Players',   icon: Users },
  { href: '/teams',      label: 'Browse Teams', icon: Trophy },
  { href: '/headlines',  label: 'Headlines',    icon: Newspaper },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <nav className="flex flex-col gap-1 p-4">
      <p
        className="text-xs font-bold uppercase tracking-widest px-3 mb-3"
        style={{ color: '#8392B5', letterSpacing: '0.18em' }}
      >
        Navigation
      </p>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: active ? 'rgba(255,90,77,0.12)' : 'transparent',
              color: active ? '#FF5A4D' : '#8392B5',
              border: active ? '1px solid rgba(255,90,77,0.2)' : '1px solid transparent',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.color = '#F0F4FF';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#8392B5';
              }
            }}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block w-60 shrink-0 fixed left-0 top-16 bottom-0 overflow-y-auto"
        style={{ background: '#0B1020', borderRight: '1px solid rgba(255,255,255,0.07)' }}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/70" onClick={onClose} />
          <aside
            className="relative z-50 w-64 flex flex-col"
            style={{ background: '#0B1020', borderRight: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center justify-between px-4 h-16"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-lg font-extrabold" style={{ color: '#F0F4FF', letterSpacing: '-0.02em' }}>
                My<span style={{ color: '#FF5A4D' }}>Sports</span>
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: '#8392B5' }}
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
