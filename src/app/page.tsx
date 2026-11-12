'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Store,
  Users,
  Package,
  ShoppingBag,
  Database,
  Lock,
  ArrowRight,
  CheckCircle2,
  Layers,
  Sparkles,
  Server,
  FileSpreadsheet,
  KeyRound,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PlatformLandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col selection:bg-zinc-900 selection:text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & MULTI-TENANT Label */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-zinc-950">
                OmniStore
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] uppercase font-semibold tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200"
              >
                Multi-Tenant
              </Badge>
            </div>
          </Link>

          {/* Single Action: Login */}
          <div className="flex items-center">
            <Link href="/login">
              <Button
                size="sm"
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 h-9 shadow-sm"
              >
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-gradient-to-tr from-zinc-100/80 via-zinc-200/40 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium mb-6 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL Architecture · Zero Payment Gateway Dependencies</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-950 mb-6 leading-[1.12]">
          One Platform. Multiple Stores. Seamless Commerce.
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Manage your business, connect with your customers, and grow your online store with a powerful multi-tenant e-commerce platform.
        </p>

        <div className="flex items-center justify-center">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold px-7 h-12 shadow-sm text-sm"
            >
              Login to Your Account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Interactive Mockup / Dashboard Preview Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-900/5 p-2 sm:p-3 shadow-lg">
          <div className="rounded-xl border border-zinc-200/90 bg-white overflow-hidden shadow-sm">
            {/* Mockup Window Chrome */}
            <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-zinc-200 text-[11px] font-mono text-zinc-500">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>omnistore.internal/store/apex-electronics</span>
              </div>
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider hidden sm:block">
                Tenant Isolation Active
              </div>
            </div>

            {/* Mockup Dashboard Content */}
            <div className="p-6 sm:p-8 space-y-6 bg-zinc-50/40">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] font-medium text-zinc-500 uppercase">Tenant Storefront</div>
                  <div className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-zinc-700" /> Apex Electronics
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">● Store Active & Online</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] font-medium text-zinc-500 uppercase">Verified Customers</div>
                  <div className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-zinc-700" /> 1,280 Verified
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Direct store invitations</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] font-medium text-zinc-500 uppercase">Active Catalog</div>
                  <div className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-zinc-700" /> 342 Products
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Synced across categories</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] font-medium text-zinc-500 uppercase">Order Fulfillment</div>
                  <div className="text-lg font-bold text-zinc-900 mt-1 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-zinc-700" /> COD & WhatsApp
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Direct merchant handling</div>
                </div>
              </div>

              {/* Sample Activity Row */}
              <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wide">
                    Recent Customer & Order Activity
                  </span>
                  <span className="text-[11px] text-zinc-400">Strict Row-Level Partitioning</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">Order #ORD-8419</p>
                      <p className="text-[11px] text-zinc-500">Cash on Delivery · ₹4,200</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Confirmed
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">Registration #CUST-9102</p>
                      <p className="text-[11px] text-zinc-500">Applicant verified by admin</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                      Approved
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-900">WhatsApp Reorder #ORD-8420</p>
                      <p className="text-[11px] text-zinc-500">Express customer checkout</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      In Transit
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Feature Pillars Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-200 w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="outline" className="mb-3 text-zinc-600 border-zinc-300">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Engineered for High-Trust Multi-Store Operations
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 leading-relaxed font-normal">
            A comprehensive commerce infrastructure providing independent merchant autonomy alongside centralized root governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pillar 1: Independent Store Management */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">
              Independent Store Management
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed flex-1">
              Every merchant receives a dedicated administrative dashboard and an isolated public storefront URL. Store admins independently oversee their catalog, pricing, settings, and branding.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>/store/[unique-slug] URL routing</span>
            </div>
          </div>

          {/* Pillar 2: Centralized Superadmin Control */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">
              Centralized Superadmin Control
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed flex-1">
              Root platform administrators manage all tenants, provision store administrator accounts, issue initial credentials, monitor global metrics, and control tenant activation or suspension states.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Closed admin provisioning flow</span>
            </div>
          </div>

          {/* Pillar 3: Secure Customer Access */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">
              Secure Customer Access
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed flex-1">
              Customers register exclusively through their merchant’s unique store URL. Store admins verify applicant details, issue credentials, and enforce mandatory password changes on first sign-in.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mandatory password reset guard</span>
            </div>
          </div>

          {/* Pillar 4: Product and Inventory Management */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">
              Product and Inventory Management
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed flex-1">
              Manage multi-level product hierarchies, custom category attributes, real-time inventory counts, and bulk Excel spreadsheet imports with comprehensive error telemetry.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bulk spreadsheet synchronization</span>
            </div>
          </div>

          {/* Pillar 5: Order Management */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">
              Order Management & Fulfillment
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed flex-1">
              Integrated support for Cash on Delivery and direct WhatsApp ordering. Real-time fulfillment tracking from order placement through delivery with instant status transitions.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>COD & WhatsApp fulfillment</span>
            </div>
          </div>

          {/* Pillar 6: Multi-Tenant Data Isolation */}
          <div className="p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-xs flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 mb-4">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">
              Multi-Tenant Data Isolation
            </h3>
            <p className="text-xs text-zinc-600 leading-relaxed flex-1">
              Rigorous relational tenant partitioning prevents data cross-contamination. Products, orders, customers, and categories are strictly isolated to their originating store.
            </p>
            <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero cross-tenant data leakage</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center w-full">
        <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 text-white relative overflow-hidden shadow-xl">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Access Your Merchant Console?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal leading-relaxed">
              Sign in with your administrator or verified customer credentials to begin managing your store and orders.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-white hover:bg-zinc-100 text-zinc-950 font-semibold px-6 h-11 text-xs"
                >
                  Sign In to OmniStore <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Footer */}
      <footer className="mt-auto border-t border-zinc-200 bg-zinc-50/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-900 text-white flex items-center justify-center font-bold text-[10px]">
              <Database className="w-3 h-3" />
            </div>
            <span className="font-semibold text-zinc-900">OmniStore Platform</span>
            <span>· Multi-Tenant Relational Commerce Engine</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-zinc-900 transition-colors">
              Console Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
