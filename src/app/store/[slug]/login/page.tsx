'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Store,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerLoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || '';

  const isJustRegistered = searchParams.get('registered') === 'true';
  const prefilledId = searchParams.get('id') || '';

  const [storeData, setStoreData] = useState<any>(null);
  const [identifier, setIdentifier] = useState(prefilledId);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch(`/api/store/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setStoreData(data.store);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (slug) loadStore();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/store/${slug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Customer flow: redirect to destination or dashboard
      window.dispatchEvent(new Event('customer-auth-changed'));
      const target = redirectParam || `/store/${slug}/dashboard`;
      router.push(target);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const redirectParam = searchParams.get('redirect') || '';
  const isFromCheckout = redirectParam.includes('checkout');

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Store Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              {storeData?.name || 'Storefront'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customer Sign In
            </p>
          </div>
        </div>

        {/* Checkout Redirect Notice */}
        {isFromCheckout && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs shadow-sm">
            <ShoppingBag className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold">Sign in to complete your checkout</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Your items are waiting in your cart. Sign in below to confirm your order details and track delivery.
              </p>
            </div>
          </div>
        )}

        {/* Success Banner if Just Registered */}
        {isJustRegistered && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold">Account created successfully!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Please enter your password to sign in and proceed.
              </p>
            </div>
          </div>
        )}

        {/* Login Card */}
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase tracking-wider">
                Step 2 of 2: Sign In
              </span>
            </div>
            <CardTitle className="text-base font-bold text-zinc-900">
              Sign In to Your Account
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Enter your registered phone or email to open your customer dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Phone or Email *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+1 555-0192 or user@example.com"
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 text-xs h-9 font-mono"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-medium h-9 bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Signing In...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-zinc-100 text-center">
              <p className="text-xs text-zinc-500">
                New customer at this store?{' '}
                <Link
                  href={`/store/${slug}/register${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security / Quality notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Locked directly to merchant store · Zero gateway fees</span>
        </div>
      </div>
    </div>
  );
}
