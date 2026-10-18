'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  Printer,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderSuccessPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const waLink = searchParams.get('waLink');

  const [order, setOrder] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/store/${slug}/orders/${orderId}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
          setStore(data.store);
        }
      } catch (e) {
        console.error('Failed to load order', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [slug, orderId]);

  const handlePrint = () => {
    window.print();
  };

  const finalWaLink = waLink ? decodeURIComponent(waLink) : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card className="text-center p-6 border-zinc-200">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-zinc-900 mb-1">
          Order Confirmed
        </h1>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-5 leading-relaxed">
          Your order has been registered directly with <strong>{store?.name || 'the merchant'}</strong>.
        </p>

        {orderId && (
          <div className="inline-flex items-center gap-2 p-2.5 px-4 rounded-lg bg-zinc-50 border border-zinc-200 text-xs mb-6">
            <span className="text-zinc-500 font-medium">Order ID:</span>
            <code className="font-mono font-bold text-zinc-900">
              #{orderId}
            </code>
          </div>
        )}

        {/* WhatsApp Instant Trigger Banner */}
        {finalWaLink && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200/80 mb-6 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-950 font-semibold text-xs">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Confirm Order via WhatsApp</span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Send your order summary directly to the merchant on WhatsApp for instant confirmation.
              </p>
            </div>

            <a
              href={finalWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0"
            >
              <Button variant="whatsapp" size="sm" className="text-xs">
                Open WhatsApp <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </a>
          </div>
        )}

        {/* Order Details Receipt Card */}
        {order && (
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-left text-xs mb-6 space-y-3">
            <div className="flex justify-between pb-3 border-b border-zinc-200/80">
              <div>
                <span className="text-zinc-400 text-[11px] block uppercase font-medium">Recipient</span>
                <p className="font-semibold text-zinc-900">{order.customerName}</p>
                <p className="text-zinc-500 font-mono text-[11px]">{order.customerPhone}</p>
              </div>
              <div className="text-right">
                <span className="text-zinc-400 text-[11px] block uppercase font-medium">Status</span>
                <span className="badge-pending mt-0.5">
                  {order.status}
                </span>
              </div>
            </div>

            <div>
              <span className="text-zinc-400 text-[11px] block uppercase font-medium">Delivery Destination</span>
              <p className="text-zinc-700 mt-0.5">{order.shippingAddress}</p>
            </div>

            <div className="pt-2 border-t border-zinc-200/60">
              <span className="text-zinc-400 text-[11px] block uppercase font-medium mb-1.5">Items</span>
              <div className="space-y-1">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-zinc-700">
                      {item.product?.title || 'Item'} <span className="text-zinc-400">× {item.quantity}</span>
                    </span>
                    <span className="font-medium text-zinc-900">
                      {formatCurrency(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-zinc-200 font-semibold text-zinc-900">
              <span>Total Paid on Delivery</span>
              <span className="text-sm font-bold text-zinc-900">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt
          </Button>

          <Link href={`/store/${slug}`} className="inline-flex">
            <Button size="sm" className="text-xs">
              Return to Catalog
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
