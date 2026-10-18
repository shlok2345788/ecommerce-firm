'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/utils';
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';
import { Button } from './ui/button';

export default function CartDrawer({ storeSlug }: { storeSlug: string }) {
  const { items, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, subtotal, totalItems } = useCart();
  const [customer, setCustomer] = React.useState<any>(null);

  React.useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch(`/api/store/${storeSlug}/auth/me`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.authenticated ? data.customer : null);
        } else {
          setCustomer(null);
        }
      } catch (e) {
        setCustomer(null);
      }
    }
    if (isCartOpen) {
      checkAuth();
    }
  }, [isCartOpen, storeSlug]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Sheet */}
      <div className="relative w-full max-w-md bg-white border-l border-zinc-200 h-full flex flex-col shadow-xl z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 text-base">Your Cart</h3>
              <p className="text-xs text-zinc-500">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-medium text-zinc-900 text-sm mb-1">Your cart is empty</h4>
              <p className="text-xs text-zinc-500 mb-4 max-w-[220px]">
                Browse our product catalog to discover and add items.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(false)}
              >
                Continue Browsing
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 p-3 rounded-lg border border-zinc-200 bg-white shadow-sm"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-16 rounded-md object-cover bg-zinc-100 shrink-0 border border-zinc-100"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="text-xs font-medium text-zinc-900 line-clamp-1 mb-0.5">
                      {item.title}
                    </h4>
                    <div className="text-xs font-semibold text-zinc-900">
                      {formatCurrency(item.price)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-zinc-600 hover:text-zinc-900 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-medium px-2 text-zinc-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-zinc-600 hover:text-zinc-900 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-400 hover:text-red-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50/50 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span className="text-base font-semibold text-zinc-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <p className="text-xs text-zinc-500">
              {customer
                ? '✓ Signed in as registered customer. Express delivery ready.'
                : '🔒 Sign in or register your account to complete this order.'}
            </p>

            {customer ? (
              <Link
                href={`/store/${storeSlug}/checkout`}
                onClick={() => setIsCartOpen(false)}
                className="w-full inline-flex"
              >
                <Button className="w-full justify-between" size="lg">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link
                href={`/store/${storeSlug}/login?redirect=/store/${storeSlug}/checkout`}
                onClick={() => setIsCartOpen(false)}
                className="w-full inline-flex"
              >
                <Button className="w-full justify-between bg-zinc-900 hover:bg-zinc-800 text-white" size="lg">
                  <span>Sign In / Sign Up to Buy</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
