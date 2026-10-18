'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  Lock,
  Mail,
  Phone,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  // Authentication & Customer state
  const [customer, setCustomer] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Inline auth mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Delivery order inputs
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = async () => {
    try {
      setCheckingAuth(true);
      const res = await fetch(`/api/store/${slug}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.customer) {
          setCustomer(data.customer);
          if (data.customer.name) setCustomerName(data.customer.name);
          if (data.customer.phone) setCustomerPhone(data.customer.phone);
        } else {
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    } catch (e) {
      setCustomer(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [slug]);

  // Handle inline sign-in
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch(`/api/store/${slug}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: authIdentifier,
          password: authPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in');
      }

      window.dispatchEvent(new Event('customer-auth-changed'));
      setCustomer(data.customer);
      if (data.customer.name) setCustomerName(data.customer.name);
      if (data.customer.phone) setCustomerPhone(data.customer.phone);
      setError(null);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle inline register
  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch(`/api/store/${slug}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          phone: authPhone,
          email: authEmail,
          password: authPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      window.dispatchEvent(new Event('customer-auth-changed'));
      setCustomer(data.customer);
      if (data.customer.name) setCustomerName(data.customer.name);
      if (data.customer.phone) setCustomerPhone(data.customer.phone || authPhone);
      setError(null);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle logout to switch account
  const handleLogout = async () => {
    try {
      await fetch(`/api/store/${slug}/auth/logout`, { method: 'POST' });
      window.dispatchEvent(new Event('customer-auth-changed'));
      setCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setShippingAddress('');
    } catch (e) {
      console.error(e);
    }
  };

  // Place order submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customer) {
      setError('Please sign in or create an account below before placing your order.');
      return;
    }

    if (!shippingAddress.trim()) {
      setError('Please enter your full delivery address.');
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        customerName: customerName.trim() || customer.name,
        customerPhone: customerPhone.trim() || customer.phone || '',
        shippingAddress: shippingAddress.trim(),
        paymentMethod: 'Cash on Delivery / Direct Confirmation',
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
        })),
      };

      const res = await fetch(`/api/store/${slug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      clearCart();

      const encodedWa = encodeURIComponent(data.whatsAppLink || '');
      router.push(`/store/${slug}/order-success?orderId=${data.order.id}&waLink=${encodedWa}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center rounded-xl bg-white border border-zinc-200 shadow-sm">
        <ShoppingBag className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-zinc-900 mb-1">Your Cart is Empty</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Add items from the store catalog before proceeding to checkout.
        </p>
        <Link href={`/store/${slug}`} className="inline-flex">
          <Button size="sm">Return to Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/store/${slug}`}
        className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Store
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Direct Checkout
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Sign in or register your customer account to place your order and enable real-time tracking
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Customer Authentication & Fulfillment (2 Cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Step 1: Customer Account Gate */}
            <Card>
              <CardHeader className="p-5 pb-3 border-b border-zinc-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">1. Customer Account</CardTitle>
                    <CardDescription className="text-xs">
                      {customer
                        ? 'Your verified customer profile for this order'
                        : 'Sign in or register to track your delivery and identify repeat orders'}
                    </CardDescription>
                  </div>
                  {customer && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Signed In
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 text-xs">
                {checkingAuth ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                ) : customer ? (
                  /* Verified Customer Badge & Switch */
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-zinc-900">{customer.name}</span>
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                              Verified Customer
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {customer.phone || customer.email}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-xs text-zinc-500 hover:text-zinc-900 underline flex items-center gap-1"
                        title="Sign out of this customer account"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Switch Account
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="font-medium text-zinc-700">Recipient Name *</label>
                        <Input
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Jordan Lee"
                          className="text-xs h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-medium text-zinc-700">Contact Phone Number *</label>
                        <Input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+91 9876543210"
                          className="text-xs h-9 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Authentication Required Block */
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700">
                      <p className="font-semibold text-zinc-900 text-xs mb-1">
                        🔒 Customer Account Required
                      </p>
                      <p className="text-[11px] text-zinc-600 leading-relaxed">
                        To place this order, please sign in or register your customer account. This saves your delivery address, enables live order status tracking, and registers you with this merchant.
                      </p>
                    </div>

                    {/* Mode Toggle Tabs */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthError(null);
                        }}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          authMode === 'login'
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        Returning Customer (Sign In)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthError(null);
                        }}
                        className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                          authMode === 'register'
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                      >
                        New Customer (Create Account)
                      </button>
                    </div>

                    {authError && (
                      <div className="flex items-center gap-2 p-2.5 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{authError}</span>
                      </div>
                    )}

                    {authMode === 'login' ? (
                      /* Inline Quick Sign-In */
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <label className="font-medium text-zinc-700">Phone or Email *</label>
                          <div className="relative">
                            <Input
                              type="text"
                              value={authIdentifier}
                              onChange={(e) => setAuthIdentifier(e.target.value)}
                              placeholder="+91 9876543210 or name@example.com"
                              className="text-xs h-9 pl-8"
                            />
                            <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-medium text-zinc-700">Password *</label>
                          <div className="relative">
                            <Input
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              className="text-xs h-9 pl-8"
                            />
                            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Button
                            type="button"
                            onClick={handleInlineLogin}
                            disabled={authLoading || !authIdentifier || !authPassword}
                            size="sm"
                            className="text-xs"
                          >
                            {authLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Signing In...
                              </>
                            ) : (
                              'Sign In & Continue to Delivery'
                            )}
                          </Button>

                          <Link
                            href={`/store/${slug}/login?redirect=/store/${slug}/checkout`}
                            className="text-[11px] text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1"
                          >
                            Full login page <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* Inline Quick Register */
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="font-medium text-zinc-700">Full Name *</label>
                            <Input
                              type="text"
                              value={authName}
                              onChange={(e) => setAuthName(e.target.value)}
                              placeholder="e.g. Rahul Sharma"
                              className="text-xs h-9"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-zinc-700">Phone Number *</label>
                            <Input
                              type="tel"
                              value={authPhone}
                              onChange={(e) => setAuthPhone(e.target.value)}
                              placeholder="+91 9876543210"
                              className="text-xs h-9 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="font-medium text-zinc-700">Email Address (Optional)</label>
                            <Input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="name@example.com"
                              className="text-xs h-9"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-medium text-zinc-700">Password (Min. 6 chars) *</label>
                            <Input
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              className="text-xs h-9"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Button
                            type="button"
                            onClick={handleInlineRegister}
                            disabled={authLoading || !authName || !authPhone || !authPassword}
                            size="sm"
                            className="text-xs"
                          >
                            {authLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Registering...
                              </>
                            ) : (
                              'Create Account & Continue to Delivery'
                            )}
                          </Button>

                          <Link
                            href={`/store/${slug}/register?redirect=/store/${slug}/checkout`}
                            className="text-[11px] text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1"
                          >
                            Full register page <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Delivery Address (Active once signed in) */}
            <Card className={!customer ? 'opacity-60 pointer-events-none' : ''}>
              <CardHeader className="p-5 pb-3 border-b border-zinc-100">
                <CardTitle className="text-sm font-semibold">2. Delivery Address</CardTitle>
                <CardDescription className="text-xs">
                  Where should the merchant dispatch your package?
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700">Full Delivery Address *</label>
                  <textarea
                    required
                    disabled={!customer}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="House/flat number, building name, street, area, city, pin code..."
                    className="w-full p-2.5 rounded-md border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 disabled:bg-zinc-100 disabled:cursor-not-allowed"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Payment Selection */}
            <Card className={!customer ? 'opacity-60 pointer-events-none' : ''}>
              <CardHeader className="p-5 pb-3 border-b border-zinc-100">
                <CardTitle className="text-sm font-semibold">3. Payment & Confirmation</CardTitle>
                <CardDescription className="text-xs">
                  Direct merchant fulfillment without third-party gateway lock-in
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5">
                <div className="p-3.5 rounded-lg border border-zinc-200 bg-zinc-50 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shrink-0 shadow-xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900">
                      Cash on Delivery / Direct Store Confirmation
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                      Pay directly upon doorstep delivery or when collecting at the store. Your order will be confirmed directly with the merchant via WhatsApp.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Summary (1 Col) */}
          <div>
            <Card className="sticky top-20">
              <CardHeader className="p-5 pb-3 border-b border-zinc-100">
                <CardTitle className="text-sm font-semibold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="divide-y divide-zinc-100 max-h-56 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-900 truncate">{item.title}</p>
                        <span className="text-[11px] text-zinc-400">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-semibold text-zinc-900 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-zinc-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Shipping</span>
                    <span className="text-emerald-700 font-medium">Free Delivery</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold text-zinc-900">
                    <span>Total Amount</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !customer || !shippingAddress.trim()}
                  className="w-full text-xs font-medium"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Placing Order...
                    </>
                  ) : !customer ? (
                    'Sign In or Register Above to Order'
                  ) : (
                    <>
                      Confirm & Place Order <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authenticated Customer Order</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
