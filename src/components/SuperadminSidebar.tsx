'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Store, Settings, LogOut, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export default function SuperadminSidebar({ adminName = 'Platform Director' }: { adminName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Overview', href: '/superadmin', icon: LayoutDashboard },
    { label: 'Admin Accounts', href: '/superadmin/admins', icon: Users },
    { label: 'Stores Directory', href: '/superadmin/stores', icon: Store },
    { label: 'System Settings', href: '/superadmin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col min-h-screen shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">OmniStore</h2>
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Superadmin</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="p-3 flex-1 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Platform Management
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-100 text-zinc-950 font-semibold'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-zinc-950' : 'text-zinc-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-zinc-900 truncate">{adminName}</p>
            <p className="text-[11px] text-zinc-500">Root Administrator</p>
          </div>
          <Link
            href="/"
            title="Visit Platform Home"
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded hover:bg-zinc-200/50 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start text-xs text-zinc-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
        </Button>
      </div>
    </aside>
  );
}
