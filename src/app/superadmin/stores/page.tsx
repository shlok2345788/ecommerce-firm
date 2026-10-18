'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Store, ExternalLink, Search, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SuperadminStoresPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/superadmin/stores');
      const data = await res.json();
      setStores(data.stores || []);
    } catch (e) {
      console.error('Failed to fetch stores', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleToggleStoreStatus = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/superadmin/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchStores();
      }
    } catch (e) {
      console.error('Failed to toggle store status', e);
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      s.admin?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Stores Directory
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Monitor and govern all active merchant storefronts on the platform
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores or owners..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Stores Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Owner Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catalog</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredStores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-zinc-500">
                  No stores found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="w-8 h-8 rounded-md object-cover border border-zinc-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <Store className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-xs text-zinc-900">{store.name}</div>
                        <a
                          href={`/store/${store.slug}`}
                          target="_blank"
                          className="inline-flex items-center text-[11px] text-zinc-400 hover:text-zinc-600 font-mono"
                        >
                          /store/{store.slug} <ExternalLink className="w-2.5 h-2.5 ml-1" />
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-zinc-800">{store.admin?.name || 'Unassigned'}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{store.admin?.email}</div>
                  </TableCell>
                  <TableCell>
                    <span className={store.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}>
                      {store.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-600">
                    <span className="font-semibold text-zinc-900">{store._count?.products || 0}</span> prods ·{' '}
                    <span className="font-semibold text-zinc-900">{store._count?.orders || 0}</span> orders
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono">
                    {store.phone || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">
                    {formatDate(store.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStoreStatus(store.id, store.status)}
                        className={`h-7 text-xs px-2 ${
                          store.status === 'ACTIVE'
                            ? 'text-red-700 hover:text-red-800 hover:bg-red-50 hover:border-red-200'
                            : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 hover:border-emerald-200'
                        }`}
                      >
                        {store.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>

                      <Link
                        href={`/store/${store.slug}`}
                        target="_blank"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                          Visit <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
