'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  Lock,
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  Store,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  storeName?: string;
  initialMode?: 'login' | 'register';
  onSuccess?: (customer: any) => void;
}

export default function CustomerAuthModal({
  isOpen,
  onClose,
  storeSlug,
  storeName = 'Store',
  initialMode = 'login',
  onSuccess,
}: CustomerAuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/store/${storeSlug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log in');
      }

      window.dispatchEvent(new Event('customer-auth-changed'));

      if (data.mustChangePassword || data.customer?.firstLogin) {
        router.push(`/store/${storeSlug}/first-login`);
      } else if (onSuccess) {
        onSuccess(data.customer);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-none flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-xl max-w-md w-full shadow-lg overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 leading-none">
                {storeName}
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1">
                {mode === 'login' ? 'Customer Account Sign In' : 'Customer Account Verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/30">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-zinc-900 text-zinc-900 font-semibold bg-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-medium text-center border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-zinc-900 text-zinc-900 font-semibold bg-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Register Request
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">
                  Login ID, Email, or Phone *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. CUST_102, user@example.com, or mobile number"
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 text-xs h-9 font-mono"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-xs font-medium h-9 mt-2 bg-zinc-900 hover:bg-zinc-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Shop <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2">
              <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto">
                <UserPlus className="w-5 h-5" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-zinc-900">
                  Customer Registration via Verified Link
                </h4>
                <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  To register with {storeName}, please submit your contact and complete delivery address details for store verification.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={`/store/${storeSlug}/register`}
                  onClick={onClose}
                  className="inline-block w-full"
                >
                  <Button className="w-full text-xs h-9 bg-zinc-900 hover:bg-zinc-800 text-white font-medium">
                    Complete Registration Form <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct offline merchant checkout · Zero gateway fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
