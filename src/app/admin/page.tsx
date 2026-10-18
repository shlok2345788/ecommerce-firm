'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  Package,
  Copy,
  Check,
  ExternalLink,
  Share2,
  QrCode,
  ArrowRight,
  Eye,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminDashboardPage() {
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [sRes, oRes] = await Promise.all([
        fetch('/api/admin/store'),
        fetch('/api/admin/orders'),
      ]);

      const sData = await sRes.json();
      const oData = await oRes.json();

      setStoreInfo(sData);
      setOrders(oData.orders || []);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const store = storeInfo?.store;
  const metrics = storeInfo?.metrics;

  const storeUrl = typeof window !== 'undefined' && store?.slug
    ? `${window.location.origin}/store/${store.slug}`
    : '';

  const handleCopy = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `🛍️ Explore our exclusive catalog and order directly with Cash on Delivery or Store Pickup!\nVisit: ${storeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Store Console
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {store?.name || 'Store'} · Catalog inventory & order fulfillment
          </p>
        </div>

        <div className="flex items-center gap-2">
          {store?.slug && (
            <Link
              href={`/store/${store.slug}`}
              target="_blank"
              className="inline-flex"
            >
              <Button variant="outline" size="sm">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Storefront
              </Button>
            </Link>
          )}
          <Link href="/admin/products" className="inline-flex">
            <Button size="sm">
              <Package className="w-3.5 h-3.5 mr-1.5" /> Manage Products
            </Button>
          </Link>
        </div>
      </div>

      {/* Unique Store Link Banner */}
      <Card className="border-zinc-200 bg-white">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Your Public Storefront Link
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Share this link with customers on WhatsApp, Instagram, or social channels
              </p>
              <div className="mt-1.5 inline-block font-mono text-xs text-zinc-800 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded">
                {storeUrl || 'Loading URL...'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copied ? 'Copied' : 'Copy Link'}
            </Button>

            <Button
              variant="whatsapp"
              size="sm"
              onClick={handleWhatsAppShare}
              className="text-xs"
            >
              <Phone className="w-3.5 h-3.5 mr-1" /> Share WhatsApp
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQR(!showQR)}
              className="text-xs"
            >
              <QrCode className="w-3.5 h-3.5 mr-1" /> {showQR ? 'Hide QR' : 'QR Code'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Expansion */}
      {showQR && (
        <Card className="max-w-xs mx-auto text-center border-zinc-200">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Storefront QR Code</CardTitle>
            <CardDescription className="text-xs">Scan on mobile to open store catalog</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex flex-col items-center">
            <div className="p-3 bg-white border border-zinc-200 rounded-lg mb-3">
              <img src={qrImageUrl} alt="Store QR Code" className="w-40 h-40" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowQR(false)} className="w-full text-xs">
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Metrics Row with Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Total Revenue</span>
                <IndianRupee className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {formatCurrency(metrics?.totalRevenue || 0)}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Total Orders</span>
                <ShoppingBag className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {store?._count?.orders || 0}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Pending Orders</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-amber-700">
                {metrics?.pendingOrders || 0}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">Active Products</span>
                <Package className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {store?._count?.products || 0}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Recent Orders Section */}
      <Card className="overflow-hidden">
        <CardHeader className="p-5 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-semibold">Recent Incoming Orders</CardTitle>
            <CardDescription className="text-xs mt-0.5">Customer purchases awaiting fulfillment</CardDescription>
          </div>
          <Link href="/admin/orders" className="text-xs font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center">
            View All Orders <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No incoming orders yet. Share your store link to start receiving orders.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 5).map((order) => {
                  const getBadge = (status: string) => {
                    switch (status) {
                      case 'PENDING': return 'badge-pending';
                      case 'CONFIRMED': return 'badge-confirmed';
                      case 'OUT_FOR_DELIVERY': return 'badge-delivery';
                      case 'DELIVERED': return 'badge-delivered';
                      case 'CANCELLED': return 'badge-cancelled';
                      default: return 'badge-active';
                    }
                  };

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs font-semibold text-zinc-900">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-zinc-900">
                        {order.customerName}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 font-mono">
                        {order.customerPhone}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-zinc-900">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {order.paymentMethod}
                      </TableCell>
                      <TableCell>
                        <span className={getBadge(order.status)}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
