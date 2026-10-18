'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
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

export default function CustomerRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = (params?.slug as string) || '';

  const redirectParam = searchParams.get('redirect') || '';
  const isFromCheckout = redirectParam.includes('checkout');

  const [storeData, setStoreData] = useState<any>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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
      const res = await fetch(`/api/store/${slug}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Customer flow: authenticated cookie is set by API, proceed to destination or dashboard
      window.dispatchEvent(new Event('customer-auth-changed'));
      const target = redirectParam || `/store/${slug}/dashboard`;
      router.push(target);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      setLoading(false);
    }
  };

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
              Customer Account Registration
            </p>
          </div>
        </div>

        {/* Checkout Redirect Notice */}
        {isFromCheckout && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs shadow-sm">
            <ShoppingBag className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold">Quick registration to complete your order</p>
              <p className="text-[11px] text-blue-700 mt-0.5">
                Register below with your name and phone/email to verify your order and enable real-time package tracking.
              </p>
            </div>
          </div>
        )}

        {/* Registration Card */}
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader className="p-6 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase tracking-wider">
                Step 1 of 2: Create Account
              </span>
            </div>
            <CardTitle className="text-base font-bold text-zinc-900">
              Register as Customer
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Create an account to unlock express 1-click reordering and access your customer dashboard.
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
                <label className="text-xs font-medium text-zinc-700">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="pl-9 text-xs h-9 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">Email Address</label>
                  <span className="text-[10px] text-zinc-400 font-normal">Optional</span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@example.com"
                    className="pl-9 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700">Password *</label>
                  <span className="text-[10px] text-zinc-400 font-normal">Min. 6 chars</span>
                </div>
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
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    Register Account <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-zinc-100 text-center">
              <p className="text-xs text-zinc-500">
                Already registered with this store?{' '}
                <Link
                  href={`/store/${slug}/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Sign In here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security / Quality notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure direct store checkout · No payment gateway commission</span>
        </div>
      </div>
    </div>
  );
}
