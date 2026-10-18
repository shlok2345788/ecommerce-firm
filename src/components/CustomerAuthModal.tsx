'use client';

import React, { useState } from 'react';
import {
  X,
  Lock,
  Phone,
  Mail,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Store,
  ShieldCheck,
  CheckCircle2,
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
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // phone or email for login
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch(`/api/store/${storeSlug}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to log in');
        }

        if (onSuccess) onSuccess(data.customer);
        onClose();
      } else {
        // Register mode
        const res = await fetch(`/api/store/${storeSlug}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        if (onSuccess) onSuccess(data.customer);
        onClose();
      }
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
              <h3 className="text-sm font-semibold text-zinc-900">
                {storeName}
              </h3>
              <p className="text-[11px] text-zinc-500">Customer Account Portal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1.5 bg-zinc-100 border-b border-zinc-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-1.5 rounded-md text-center transition-all ${
              mode === 'login'
                ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-1.5 rounded-md text-center transition-all ${
              mode === 'register'
                ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="mb-4">
            <h4 className="text-base font-bold text-zinc-900">
              {mode === 'login' ? 'Login to Shop' : 'Register Customer Account'}
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              {mode === 'login'
                ? 'Access your express reorder shelf, past orders, and fast 1-click checkout.'
                : 'Locked under role CUSTOMER. Enjoy personalized repeat ordering and order tracking.'}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>
            )}

            {mode === 'login' ? (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-zinc-700">Phone or Email *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="+1 555-0192 or user@example.com"
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-700">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="pl-8 text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-zinc-700">
                    Email Address <span className="text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jordan@example.com"
                      className="pl-8 text-xs h-9"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-700">Password *</label>
                {mode === 'register' && (
                  <span className="text-[10px] text-zinc-400">Min. 6 chars</span>
                )}
              </div>
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
                  {mode === 'login' ? 'Signing in...' : 'Registering customer...'}
                </>
              ) : mode === 'login' ? (
                <>
                  Sign In to Shop <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              ) : (
                <>
                  Complete Registration <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct offline merchant checkout · Zero gateway fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
