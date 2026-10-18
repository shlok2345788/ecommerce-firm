'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, CheckCircle2, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TrackOrderPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);

    try {
      const cleanId = orderId.replace('#', '').trim();
      const res = await fetch(`/api/store/${slug}/orders/${cleanId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Order not found. Please verify your Order ID.');
      }

      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'PENDING', label: 'Placed', desc: 'Awaiting confirmation' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Packed & ready' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'En route to address' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Completed & fulfilled' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'OUT_FOR_DELIVERY': return 2;
      case 'DELIVERED': return 3;
      default: return -1;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : -1;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link
        href={`/store/${slug}`}
        className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Store
      </Link>

      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Track Order Status
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Check real-time fulfillment and delivery progress for your order
        </p>
      </div>

      {/* Lookup Form */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <form onSubmit={handleTrack} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter your Order ID..."
                className="pl-9 text-xs h-9 font-mono"
              />
            </div>
            <Button type="submit" disabled={loading} size="sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
            </Button>
          </form>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mt-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Status Display */}
      {order && (
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-zinc-100 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-[11px]">Tracking Order</CardDescription>
              <CardTitle className="text-sm font-mono font-bold">#{order.id}</CardTitle>
            </div>
            <div className="text-right">
              <CardDescription className="text-[11px]">Total Amount</CardDescription>
              <span className="text-sm font-bold text-zinc-900">{formatCurrency(order.totalAmount)}</span>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-6">
            {/* Timeline Steps */}
            {order.status === 'CANCELLED' ? (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-center text-xs">
                This order was cancelled by the store administrator.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                {steps.map((st, idx) => {
                  const isCompleted = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  return (
                    <div key={st.key} className="space-y-1">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-semibold ${
                          isCompleted
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                        } ${isCurrent ? 'ring-2 ring-zinc-900 ring-offset-2' : ''}`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <p className="text-[11px] font-semibold text-zinc-900">{st.label}</p>
                      <p className="text-[10px] text-zinc-400 leading-tight">{st.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recipient Details */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Recipient:</span>
                <span className="font-medium text-zinc-900">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contact:</span>
                <span className="font-mono text-zinc-800">{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivery Address:</span>
                <span className="text-zinc-700 text-right max-w-xs">{order.shippingAddress}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
