'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold text-white tracking-tight">
              My<span className="text-blue-500">Sports</span>
            </span>
          </Link>
        </div>

        {/* Right: user menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-slate-300 hover:text-white rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {session?.user?.name?.charAt(0)?.toUpperCase() ??
                session?.user?.email?.charAt(0)?.toUpperCase() ??
                '?'}
            </div>
            <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
              {session?.user?.name ?? session?.user?.email}
            </span>
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <p className="text-sm text-white font-medium truncate">
                    {session?.user?.name ?? 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
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
