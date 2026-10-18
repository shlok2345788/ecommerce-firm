'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  KeyRound,
  ArrowRight,
  Database,
  ExternalLink,
  ShoppingBag,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlatformLandingPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStores() {
      try {
        const res = await fetch('/api/superadmin/stores');
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-zinc-900">
                OmniStore
              </span>
              <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                Multi-Tenant
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex">
              <Button variant="outline" size="sm">
                Console Login
              </Button>
            </Link>
            <Link href="/superadmin" className="inline-flex">
              <Button size="sm">
                Superadmin Portal <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>PostgreSQL Relational Engine · Zero Payment Gateway Dependencies</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-950 mb-5 leading-tight">
          Commercial Multi-Tenant E-Commerce Platform
        </h1>

        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Row-level PostgreSQL multi-tenancy connecting Superadmin governance, isolated store owner management consoles, and guest checkout storefronts with Cash on Delivery and WhatsApp fulfillment.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="inline-flex">
            <Button size="lg" className="font-medium">
              Access Management Console <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <a href="#stores" className="inline-flex">
            <Button variant="outline" size="lg" className="font-medium">
              Explore Live Storefronts
            </Button>
          </a>
        </div>
      </section>

      {/* Role Architecture Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900">
            Three Dedicated Role Interfaces
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Tailored consoles for platform owners, merchants, and customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Superadmin Card */}
          <Card className="flex flex-col">
            <CardHeader className="p-6 pb-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Role 1: Global Admin</span>
                <span className="font-mono text-[11px] text-zinc-400">/superadmin</span>
              </div>
              <CardTitle className="text-base font-semibold">Superadmin Console</CardTitle>
              <CardDescription className="text-xs leading-relaxed mt-1">
                Provision merchant accounts, generate temporary login passwords, oversee global metrics, and control store suspension states.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 mt-auto">
              <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-600 mb-4">
                Platform Provisioning & Multi-Store Governance
              </div>
              <Link href="/superadmin" className="w-full inline-flex">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Launch Superadmin Portal →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Store Admin Card */}
          <Card className="flex flex-col">
            <CardHeader className="p-6 pb-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Role 2: Merchant</span>
                <span className="font-mono text-[11px] text-zinc-400">/admin</span>
              </div>
              <CardTitle className="text-base font-semibold">Store Management</CardTitle>
              <CardDescription className="text-xs leading-relaxed mt-1">
                Full catalog management, categories, image URLs, pricing tiers, order status tracking, and order export to CSV.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 mt-auto">
              <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-600 mb-4">
                Store Catalog, Orders & Inventory Management
              </div>
              <Link href="/admin" className="w-full inline-flex">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Launch Merchant Console →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card className="flex flex-col">
            <CardHeader className="p-6 pb-4">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 mb-3">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Role 3: Customer</span>
                <span className="font-mono text-[11px] text-zinc-400">/store/[slug]</span>
              </div>
              <CardTitle className="text-base font-semibold">Public Storefronts</CardTitle>
              <CardDescription className="text-xs leading-relaxed mt-1">
                Category filters, responsive catalog search, dynamic sliding cart drawer, and frictionless guest checkout without gateway lock-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 mt-auto">
              <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-600 mb-4">
                Guest Checkout · Cash on Delivery
              </div>
              <Link href={stores.length > 0 ? `/store/${stores[0].slug}` : "#stores"} className="w-full inline-flex">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Browse Storefront →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Live Storefronts from Database */}
      <section id="stores" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900">
              Live Tenant Storefronts
            </h2>
            <p className="text-xs text-zinc-500">
              Stores dynamically pulled from the PostgreSQL database
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-32" />
            </Card>
            <Card className="p-6 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-32" />
            </Card>
          </div>
        ) : stores.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-white border border-zinc-200 text-xs text-zinc-500">
            No stores registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stores.map((store) => (
              <Card key={store.id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="w-9 h-9 rounded-md object-cover border border-zinc-200" />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-zinc-900 text-white flex items-center justify-center">
                        <Store className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">{store.name}</h3>
                      <span className="font-mono text-xs text-zinc-400">/store/{store.slug}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed mb-4">
                    {store.description || 'Verified multi-tenant merchant catalog.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {store._count?.products || 0} products listed
                  </span>
                  <Link href={`/store/${store.slug}`} className="inline-flex">
                    <Button size="sm" variant="default" className="text-xs">
                      Visit Storefront <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 px-4 text-center text-xs text-zinc-500 mt-auto">
        <p>© 2026 OmniStore Platform. Built with PostgreSQL, Prisma ORM, Next.js, and Tailwind CSS.</p>
      </footer>
    </div>
  );
}
