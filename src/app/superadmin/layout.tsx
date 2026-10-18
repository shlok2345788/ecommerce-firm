'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SuperadminSidebar from '@/components/SuperadminSidebar';
import { Loader2 } from 'lucide-react';

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();

        if (!data.authenticated || data.user.role !== 'SUPERADMIN') {
          router.push('/login');
          return;
        }

        setUser(data.user);
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-500 text-xs">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-900" />
          <span>Verifying Superadmin Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/60 text-zinc-900">
      <SuperadminSidebar adminName={user?.name} />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
