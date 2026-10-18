'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Store,
  Users,
  Package,
  ShoppingBag,
  IndianRupee,
  Plus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SuperadminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdAdminInfo, setCreatedAdminInfo] = useState<any>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Form fields for new admin
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/superadmin/metrics');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    try {
      const res = await fetch('/api/superadmin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          storeName,
          phone,
          address,
          customPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create admin');
      }

      setCreatedAdminInfo(result.admin);
      setIsModalOpen(false);
      // Reset form
      setAdminName('');
      setAdminEmail('');
      setStoreName('');
      setPhone('');
      setAddress('');
      setCustomPassword('');
      fetchMetrics();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdAdminInfo) return;
    const text = `OmniStore Merchant Credentials:
Portal URL: ${window.location.origin}/login
Email: ${createdAdminInfo.email}
Temporary Password: ${createdAdminInfo.temporaryPassword}
Storefront URL: ${window.location.origin}/store/${createdAdminInfo.store.slug}

*Note: You will be prompted to set your personal password on your first login.*`;

    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const { metrics, recentStores, recentAdmins } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Platform Metrics & Governance
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Aggregated global data across all multi-tenant stores connected to PostgreSQL
          </p>
        </div>

        <Button
          onClick={() => {
            setCreatedAdminInfo(null);
            setIsModalOpen(true);
          }}
          size="sm"
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Provision Admin Account
        </Button>
      </div>

      {/* Success Notification Banner for newly created admin */}
      {createdAdminInfo && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-950">
                Merchant Account Provisioned Successfully
              </p>
              <p className="text-emerald-800 mt-0.5">
                Email: <span className="font-mono font-medium">{createdAdminInfo.email}</span> · Temp Password:{' '}
                <span className="font-mono font-semibold bg-emerald-100 px-1 py-0.5 rounded text-emerald-950">
                  {createdAdminInfo.temporaryPassword}
                </span>{' '}
                · Store: <span className="font-mono">/store/{createdAdminInfo.store.slug}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCredentials}
              className="text-xs border-emerald-300 text-emerald-900 hover:bg-emerald-100 bg-white"
            >
              {copiedPass ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiedPass ? 'Copied' : 'Copy Credentials'}
            </Button>
            <button
              onClick={() => setCreatedAdminInfo(null)}
              className="p-1 rounded text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row with Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Total Stores</span>
                <Store className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {metrics?.totalStores || 0}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Active Admins</span>
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {metrics?.totalAdmins || 0}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Total Products</span>
                <Package className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {metrics?.totalProducts || 0}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {metrics?.totalOrders || 0}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Platform GMV</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {formatCurrency(metrics?.totalRevenue || 0)}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Two Column Grid: Stores & Admins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stores */}
        <Card className="overflow-hidden">
          <CardHeader className="p-5 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Active Tenant Stores</CardTitle>
              <CardDescription className="text-xs mt-0.5">Live stores hosted on the platform</CardDescription>
            </div>
            <Link href="/superadmin/stores" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
              View All Stores →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : recentStores?.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No stores registered yet. Click "Provision Admin Account" to create your first store.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentStores?.map((store: any) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium text-zinc-900">
                        <div>
                          <div className="font-medium text-xs text-zinc-900">{store.name}</div>
                          <span className="text-[11px] text-zinc-400 font-mono">/store/{store.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        {store.admin?.name || 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <span className={store.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}>
                          {store.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/store/${store.slug}`}
                          target="_blank"
                          className="inline-flex items-center text-xs font-medium text-zinc-600 hover:text-zinc-900"
                        >
                          Visit <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Merchant Administrators */}
        <Card className="overflow-hidden">
          <CardHeader className="p-5 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold">Store Administrators</CardTitle>
              <CardDescription className="text-xs mt-0.5">Registered merchants and access status</CardDescription>
            </div>
            <Link href="/superadmin/admins" className="text-xs font-medium text-zinc-600 hover:text-zinc-900">
              Manage Admins →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : recentAdmins?.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No merchant administrators found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrator</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAdmins?.map((admin: any) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="font-medium text-xs text-zinc-900">{admin.name}</div>
                        <div className="text-[11px] text-zinc-400">{admin.email}</div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        {admin.stores?.[0]?.name || 'No Store'}
                      </TableCell>
                      <TableCell>
                        <span className={admin.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}>
                          {admin.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href="/superadmin/admins"
                          className="inline-flex items-center text-xs font-medium text-zinc-600 hover:text-zinc-900"
                        >
                          Manage
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Provision Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div
            className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Provision New Admin & Store</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Creates merchant credentials and creates their storefront</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Admin Full Name *</label>
                  <Input
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Admin Email Address *</label>
                  <Input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="sarah@mystore.com"
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Store Brand Name *</label>
                  <Input
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Artisan Pottery Co."
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Store Phone / WhatsApp *</label>
                  <Input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">Business Address (Optional)</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">Custom Temporary Password (Optional)</label>
                <Input
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Leave empty to auto-generate a secure password"
                  className="text-xs h-8"
                />
              </div>

              <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200 text-zinc-500 text-[11px]">
                ℹ️ The merchant is automatically flagged for forced password reset upon their first login.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formSubmitting}
                  size="sm"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Provisioning...
                    </>
                  ) : (
                    'Provision Account'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
