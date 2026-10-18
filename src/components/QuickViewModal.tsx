'use client';

import React, { useState } from 'react';
import { ProductProps } from './ProductCard';
import { formatCurrency, calculateDiscount } from '@/lib/utils';
import { useCart } from '@/lib/cartContext';
import { X, ShoppingBag, Check, ShieldCheck, Truck, ImageOff } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function QuickViewModal({
  product,
  onClose,
}: {
  product: ProductProps | null;
  onClose: () => void;
}) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [];
  const discountPercent = calculateDiscount(product.price, product.discountPrice);
  const effectivePrice = product.discountPrice || product.price;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gallery Column */}
          <div>
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 mb-3">
              {images[selectedImageIndex] ? (
                <img
                  src={images[selectedImageIndex]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-400">
                  <ImageOff className="w-8 h-8" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-md overflow-hidden border shrink-0 ${
                      selectedImageIndex === idx ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-zinc-200 opacity-70'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="flex flex-col">
            {product.category && (
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                {product.category.name}
              </span>
            )}

            <h2 className="text-xl font-semibold text-zinc-900 leading-snug mb-2">
              {product.title}
            </h2>

            {/* Pricing */}
            <div className="flex items-baseline gap-2.5 mb-4">
              <span className="text-2xl font-bold text-zinc-900">
                {formatCurrency(effectivePrice)}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-zinc-400 line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
              {discountPercent && (
                <Badge variant="destructive" className="ml-1">
                  Save {discountPercent}%
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-600 leading-relaxed mb-4">
              {product.description || 'Authentic product verified by store merchant. Fast and reliable direct fulfillment.'}
            </p>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-6 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  isOutOfStock ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
              <span className={isOutOfStock ? 'text-red-700 font-medium' : 'text-emerald-700 font-medium'}>
                {isOutOfStock ? 'Currently Out of Stock' : `In Stock (${product.stock} units available)`}
              </span>
            </div>

            {/* CTA */}
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full mb-6"
              size="lg"
            >
              {added ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-emerald-400" /> Added to Cart
                </>
              ) : isOutOfStock ? (
                'Sold Out'
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-2" /> Add to Cart
                </>
              )}
            </Button>

            {/* Trust details */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100 text-xs text-zinc-500 mt-auto">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-zinc-400" />
                <span>Fast Direct Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <span>Cash on Arrival / Pickup</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
