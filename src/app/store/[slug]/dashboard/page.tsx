'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProductCard, { ProductProps } from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import {
  User,
  ShoppingBag,
  IndianRupee,
  Clock,
  Package,
  Store,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  LogOut,
  Sparkles,
  PackageCheck,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductProps | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/store/${slug}/customer/dashboard`);
      if (res.status === 401) {
        // Not authenticated, redirect to customer login
        router.push(`/store/${slug}/login`);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchDashboard();
  }, [slug]);

  const handleLogout = async () => {
    try {
      await fetch(`/api/store/${slug}/auth/logout`, { method: 'POST' });
      window.dispatchEvent(new Event('customer-auth-changed'));
      router.push(`/store/${slug}/login`);
    } catch (e) {
      router.push(`/store/${slug}/login`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80';
      case 'CONFIRMED':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'OUT_FOR_DELIVERY':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/80';
      case 'DELIVERED':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'CANCELLED':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200/80';
      default:
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const customer = data?.customer;
  const stats = data?.stats;
  const store = data?.store;
  const orders = data?.orders || [];
  const reorderProducts = data?.reorderProducts || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome & Profile Header Banner */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
            {customer?.name
              ? customer.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'CU'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                {customer?.name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase tracking-wider">
                Customer Account
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1 font-mono text-zinc-700">
                <Phone className="w-3.5 h-3.5 text-zinc-400" /> {customer?.phone}
              </span>
              {customer?.email && !customer.email.includes('.internal') && (
                <span className="flex items-center gap-1 text-zinc-600">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" /> {customer.email}
                </span>
              )}
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-500">
                Registered with {store?.name || 'this store'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/store/${slug}`}>
            <Button size="sm" variant="outline" className="text-xs border-zinc-300">
              <Store className="w-3.5 h-3.5 mr-1.5" /> Back to Store
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={handleLogout}
            className="text-xs border-zinc-200 text-zinc-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Orders */}
        <Card className="p-4 border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Orders Placed</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
            {stats?.totalOrders || 0}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Purchases at {store?.name}</p>
        </Card>

        {/* Metric 2: Lifetime Spent */}
        <Card className="p-4 border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Lifetime Spent</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 font-mono">
            {formatCurrency(stats?.lifetimeSpent || 0)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Direct merchant fulfillment</p>
        </Card>

        {/* Metric 3: Active Orders */}
        <Card className="p-4 border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Active / In-Transit Orders</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
            {stats?.activeOrders || 0}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">Pending confirmation or delivery</p>
        </Card>
      </div>

      {/* Section 1: Express Reorder Shelf */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-900" /> Express Reorder Shelf
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Items previously purchased by your account. Rapidly reorder in 1 click.
            </p>
          </div>

          <Link href={`/store/${slug}`} className="inline-flex">
            <Button variant="outline" size="sm" className="text-xs">
              View Entire Catalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {reorderProducts.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-zinc-200 bg-[#FAFAFA] space-y-3">
            <Package className="w-9 h-9 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-900">
              No prior orders to reorder yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Once you place an order, your favorite items will appear here for fast 1-click replenishment.
            </p>
            <Link href={`/store/${slug}`} className="inline-block pt-1">
              <Button size="sm" className="text-xs bg-zinc-900 text-white">
                Start Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {reorderProducts.map((prod: any) => (
              <ProductCard
                key={prod.id}
                product={prod}
                isReorder={true}
                badgeText={prod.badge}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Order History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-zinc-900" /> Your Order History ({orders.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Full breakdown of orders placed at {store?.name || 'this store'}
            </p>
          </div>

          <Link href={`/store/${slug}/track`} className="inline-flex">
            <Button variant="outline" size="sm" className="text-xs">
              <PackageCheck className="w-3.5 h-3.5 mr-1" /> Track Order Status
            </Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-zinc-200 bg-white">
            <ShoppingBag className="w-9 h-9 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-900">No orders placed yet</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Browse the catalog and submit your first order with direct merchant checkout.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord: any) => (
              <div
                key={ord.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-zinc-900 text-sm">
                      #{ord.id.slice(0, 8)}
                    </span>
                    <span className={getStatusBadge(ord.status)}>
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-zinc-500">
                    <span>{formatDate(ord.createdAt)}</span>
                    <Link
                      href={`/store/${slug}/track`}
                      className="inline-flex items-center text-zinc-700 hover:text-zinc-950 hover:underline font-medium"
                    >
                      Track <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-zinc-100">
                  {ord.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-200">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-zinc-500">
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-semibold text-zinc-900 shrink-0">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Order Bottom Bar */}
                <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-zinc-50/70 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-zinc-600">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-sm">{ord.shippingAddress}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-zinc-500">{ord.paymentMethod}</span>
                    <div className="text-sm font-bold text-zinc-900 font-mono">
                      Total: {formatCurrency(ord.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
