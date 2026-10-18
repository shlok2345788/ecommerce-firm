'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [storeData, setStoreData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAdmin() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();

        if (!meData.authenticated || meData.user.role !== 'ADMIN') {
          router.push('/login');
          return;
        }

        if (meData.user.firstLogin) {
          router.push('/admin/first-login');
          return;
        }

        setUser(meData.user);

        const storeRes = await fetch('/api/admin/store');
        if (storeRes.ok) {
          const sJson = await storeRes.json();
          setStoreData(sJson.store);
        }
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    initAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 text-xs">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
          <span>Loading Store Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/60 text-zinc-900">
      <AdminSidebar
        storeName={storeData?.name || 'My Store'}
        storeSlug={storeData?.slug || ''}
        adminName={user?.name || 'Store Owner'}
      />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
