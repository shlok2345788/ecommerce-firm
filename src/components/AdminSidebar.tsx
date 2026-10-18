'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Sliders,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  Store,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export default function AdminSidebar({
  storeName = 'Store Management',
  storeSlug = '',
  adminName = 'Merchant',
}: {
  storeName?: string;
  storeSlug?: string;
  adminName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  const handleCopyLink = () => {
    if (!storeSlug) return;
    const url = `${window.location.origin}/store/${storeSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Customer Analytics', href: '/admin/analytics/customers', icon: Users },
    { label: 'Store Settings', href: '/admin/store-settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col min-h-screen shrink-0">
      {/* Store Identity Header */}
      <div className="p-4 border-b border-zinc-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900 truncate tracking-tight">{storeName}</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Store Active
            </div>
          </div>
        </div>

        {/* Quick Link Box */}
        {storeSlug && (
          <div className="flex items-center justify-between gap-1 p-1.5 pl-2.5 rounded-md bg-zinc-50 border border-zinc-200/70 text-xs">
            <span className="text-zinc-500 truncate font-mono text-[11px]">
              /store/{storeSlug}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleCopyLink}
                title="Copy store URL"
                className="p-1 rounded hover:bg-zinc-200/60 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <Link
                href={`/store/${storeSlug}`}
                target="_blank"
                title="Visit public storefront"
                className="p-1 rounded hover:bg-zinc-200/60 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="p-3 flex-1 space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Merchant Navigation
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
        <div className="mb-3 px-1">
          <p className="text-xs font-semibold text-zinc-900 truncate">{adminName}</p>
          <p className="text-[11px] text-zinc-500">Store Administrator</p>
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
