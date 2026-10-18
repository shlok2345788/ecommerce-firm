'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.user.role === 'SUPERADMIN') {
        router.push('/superadmin');
      } else if (data.user.firstLogin) {
        router.push('/admin/first-login');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 text-white mb-3 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            OmniStore Console
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Sign in to manage your platform or storefront
          </p>
        </div>

        <Card className="border-zinc-200/90 shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Email or Username
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or username"
                    className="pl-8 text-xs"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-8 text-xs"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Return to Platform Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
