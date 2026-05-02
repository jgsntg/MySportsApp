'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{ background: '#0B1020', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: '#8392B5' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F0F4FF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8392B5')}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <span
              className="text-xl font-extrabold tracking-tight"
              style={{ color: '#F0F4FF', letterSpacing: '-0.02em' }}
            >
              My<span style={{ color: '#FF5A4D' }}>Sports</span>
            </span>
          </Link>
        </div>

        {/* Right: user menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(v => !v)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
            style={{ color: '#8392B5' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F0F4FF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8392B5')}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: '#FF5A4D' }}
            >
              {session?.user?.name?.charAt(0)?.toUpperCase() ??
                session?.user?.email?.charAt(0)?.toUpperCase() ??
                '?'}
            </div>
            <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]" style={{ color: '#F0F4FF' }}>
              {session?.user?.name ?? session?.user?.email}
            </span>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl z-20 overflow-hidden"
                style={{ background: '#121A30', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-sm font-medium truncate" style={{ color: '#F0F4FF' }}>
                    {session?.user?.name ?? 'User'}
                  </p>
                  <p className="text-xs truncate" style={{ color: '#8392B5' }}>{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors"
                  style={{ color: '#8392B5' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#1A2440';
                    e.currentTarget.style.color = '#F0F4FF';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#8392B5';
                  }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
