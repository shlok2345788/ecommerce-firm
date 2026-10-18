'use client';

import React, { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import {
  Users,
  KeyRound,
  Trash2,
  Check,
  Copy,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SuperadminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetModalData, setResetModalData] = useState<{ email: string; newPass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/superadmin/admins');
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (e) {
      console.error('Failed to fetch admins', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleToggleStatus = async (adminId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/superadmin/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAdmins();
      }
    } catch (e) {
      console.error('Failed to toggle status', e);
    }
  };

  const handleResetPassword = async (adminId: string, email: string) => {
    if (!confirm(`Generate a new temporary password for ${email}?`)) return;

    try {
      const res = await fetch(`/api/superadmin/admins/${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetModalData({
          email,
          newPass: data.newTemporaryPassword,
        });
        fetchAdmins();
      }
    } catch (e) {
      console.error('Failed to reset password', e);
    }
  };

  const handleDeleteAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Permanently delete admin account for ${email} and all associated store data?`)) return;

    try {
      const res = await fetch(`/api/superadmin/admins/${adminId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchAdmins();
      }
    } catch (e) {
      console.error('Failed to delete admin', e);
    }
  };

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.stores?.[0]?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Admin Accounts
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage merchant accounts, access permissions, and temporary login credentials
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admins or stores..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Assigned Store</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>First Login</TableHead>
              <TableHead>Catalog Metrics</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
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
            ) : filteredAdmins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-zinc-500">
                  No administrators found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAdmins.map((admin) => {
                const store = admin.stores?.[0];
                return (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="font-medium text-xs text-zinc-900">{admin.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{admin.email}</div>
                    </TableCell>
                    <TableCell>
                      {store ? (
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
                      ) : (
                        <span className="text-xs text-zinc-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={admin.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}>
                        {admin.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {admin.firstLogin ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          Pending Reset
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium">
                          ✓ Configured
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600">
                      {store?._count?.products || 0} prods · {store?._count?.orders || 0} orders
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {formatDate(admin.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(admin.id, admin.status)}
                          className="h-7 text-xs px-2"
                        >
                          {admin.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(admin.id, admin.email)}
                          className="h-7 text-xs px-2"
                          title="Generate new temporary password"
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1" /> Reset Pass
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          className="h-7 text-xs px-2"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Password Reset Modal */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setResetModalData(null)}>
          <div
            className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-xl p-5 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-5 h-5" />
            </div>

            <h3 className="text-sm font-semibold text-zinc-900">New Credentials Generated</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              Password for <strong className="text-zinc-800">{resetModalData.email}</strong>:
            </p>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 mb-4">
              <code className="text-sm font-mono font-bold text-zinc-900">
                {resetModalData.newPass}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(resetModalData.newPass);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="h-7 text-xs px-2"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <Button
              className="w-full text-xs"
              size="sm"
              onClick={() => setResetModalData(null)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
