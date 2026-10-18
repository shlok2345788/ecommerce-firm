'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cartContext';
import { ShoppingBag, Store, Phone, Search, PackageCheck, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import CustomerAuthModal from './CustomerAuthModal';

export default function StoreHeader({ store }: { store: any }) {
  const { totalItems, setIsCartOpen } = useCart();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const checkAuth = async () => {
    try {
      const res = await fetch(`/api/store/${store.slug}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      }
    } catch (e) {
      setCustomer(null);
    }
  };

  React.useEffect(() => {
    checkAuth();
    const handleAuthChange = () => checkAuth();
    window.addEventListener('customer-auth-changed', handleAuthChange);
    return () => window.removeEventListener('customer-auth-changed', handleAuthChange);
  }, [store.slug]);

  const handleLogout = async () => {
    try {
      await fetch(`/api/store/${store.slug}/auth/logout`, { method: 'POST' });
      setCustomer(null);
      window.dispatchEvent(new Event('customer-auth-changed'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/store/${store.slug}?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href={`/store/${store.slug}`}
            className="flex items-center gap-3 shrink-0"
          >
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="w-9 h-9 rounded-md object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-zinc-900 tracking-tight leading-none truncate">
                {store.name}
              </h1>
              <span className="text-[11px] text-zinc-500 font-normal">Official Merchant</span>
            </div>
          </Link>

          {/* Search Bar in Header */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products in this store..."
                className="w-full h-9 pl-9 pr-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-colors"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Customer Authentication State */}
            {customer ? (
              <div className="flex items-center gap-2 border-r border-zinc-200 pr-2 sm:pr-3">
                <Link
                  href={`/store/${store.slug}/dashboard`}
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200/70 px-2.5 py-1 rounded-md border border-zinc-200 transition-colors"
                  title="Open Customer Dashboard"
                >
                  <User className="w-3.5 h-3.5 text-zinc-700" />
                  <span className="max-w-[100px] truncate">{customer.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-zinc-500 font-normal hidden sm:inline">· Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1 rounded text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 border-r border-zinc-200 pr-2 sm:pr-3">
                <Link href={`/store/${store.slug}/register`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 px-2.5 border-zinc-200 text-zinc-700 hover:text-zinc-900"
                  >
                    Register
                  </Button>
                </Link>
                <Link href={`/store/${store.slug}/login`}>
                  <Button
                    size="sm"
                    className="text-xs h-8 px-2.5 bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            )}

            <Link
              href={`/store/${store.slug}/track`}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
            >
              <PackageCheck className="w-4 h-4 text-zinc-500" />
              <span>Track Order</span>
            </Link>

            {store.phone && (
              <a
                href={`https://wa.me/${store.phone.replace(/[^\d+]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 hover:bg-emerald-100 px-2.5 py-1.5 rounded-md transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Cart Trigger */}
            <Button
              onClick={() => setIsCartOpen(true)}
              size="sm"
              className="relative font-medium h-8"
            >
              <ShoppingBag className="w-4 h-4 mr-1.5" />
              <span>Cart</span>
              {totalItems > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-zinc-900">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        storeSlug={store.slug}
        storeName={store.name}
        initialMode={authMode}
        onSuccess={(cust) => {
          setCustomer(cust);
          window.dispatchEvent(new Event('customer-auth-changed'));
        }}
      />
    </>
  );
}
