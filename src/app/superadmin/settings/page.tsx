'use client';

import React from 'react';
import { Database, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SuperadminSettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-2 border-b border-zinc-200">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          System Architecture & Database Settings
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Global platform infrastructure, PostgreSQL connectivity, and tenancy parameters
        </p>
      </div>

      <div className="space-y-4">
        {/* Database Health */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Relational Database (PostgreSQL)</CardTitle>
                <CardDescription className="text-xs">
                  Connected via Prisma ORM engine with real-time schema synchronization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs">
              <div>
                <span className="text-zinc-400 block text-[11px]">Database Host</span>
                <span className="font-mono font-medium text-zinc-800">127.0.0.1:5432</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">Database Name</span>
                <span className="font-mono font-medium text-zinc-800">ecommerce_multitenant</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">ORM Engine</span>
                <span className="font-medium text-zinc-800">Prisma Client v5.22.0</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[11px]">Connection Status</span>
                <span className="inline-flex items-center text-emerald-700 font-semibold gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenancy Model */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Row-Level Multi-Tenancy</CardTitle>
                <CardDescription className="text-xs">
                  Relational store partition architecture
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-zinc-600 space-y-3">
            <p className="leading-relaxed">
              Every catalog item, category, and customer order is strictly bound to its corresponding{' '}
              <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800">Store.id</code> with foreign key cascade rules. Customer storefronts are accessible via unique URL slugs at{' '}
              <code className="px-1.5 py-0.5 rounded bg-zinc-100 font-mono text-zinc-800">/store/[store-slug]</code>.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">Foreign Key Cascades</Badge>
              <Badge variant="outline">Store Slug Index</Badge>
              <Badge variant="outline">Isolated Merchant Catalogs</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Payment Policy */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Zero Payment Gateway Friction</CardTitle>
                <CardDescription className="text-xs">
                  Direct customer-to-merchant fulfillment modes
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-zinc-600 leading-relaxed">
            Eliminates high third-party gateway commissions, delayed merchant payouts, and KYC barriers. Customers order via guest checkout, and stores confirm orders via Cash on Delivery, In-Person Store Pickup, or formatted WhatsApp order slips.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
