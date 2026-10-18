'use client';

import React, { useState } from 'react';
import { formatCurrency, calculateDiscount } from '@/lib/utils';
import { ShoppingBag, Eye, Check, ImageOff } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export interface ProductProps {
  id: string;
  title: string;
  description?: string | null;
  price: number | string;
  discountPrice?: number | string | null;
  stock: number;
  images: string[];
  category?: { name: string; slug: string } | null;
  badge?: string | null;
  isReorderItem?: boolean;
  orderCount?: number;
  lastOrderedAt?: string | Date;
}

export default function ProductCard({
  product,
  onQuickView,
  isReorder = false,
  badgeText,
}: {
  product: ProductProps;
  onQuickView?: (product: ProductProps) => void;
  isReorder?: boolean;
  badgeText?: string | null;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const discountPercent = calculateDiscount(product.price, product.discountPrice);
  const effectivePrice = product.discountPrice || product.price;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const mainImage = product.images?.[0];
  const activeBadge = badgeText || product.badge;
  const showReorder = isReorder || product.isReorderItem;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      onClick={() => onQuickView && onQuickView(product)}
      className="group relative flex flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Aspect-square Image Container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-100 mb-3 border border-zinc-100">
        {mainImage && !imgError ? (
          <img
            src={mainImage}
            alt={product.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-400 bg-zinc-50">
            <ImageOff className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[11px] mt-1 text-zinc-400">No Image</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 max-w-[85%]">
          {activeBadge && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                activeBadge === 'Top Sellers'
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-zinc-100 text-zinc-900 border-zinc-300'
              }`}
            >
              {activeBadge}
            </span>
          )}
          {discountPercent && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-600 text-white">
              -{discountPercent}%
            </span>
          )}
          {isLowStock && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
              Only {product.stock} left
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-white">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick View Button */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="absolute bottom-2 right-2 bg-white/95 text-zinc-700 hover:text-zinc-950 p-1.5 rounded-md shadow-sm border border-zinc-200/80 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Quick view"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col">
        {product.category && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
            {product.category.name}
          </span>
        )}

        <h3 className="text-sm font-medium text-zinc-900 line-clamp-2 leading-snug mb-1.5 group-hover:text-zinc-950">
          {product.title}
        </h3>

        {/* Optional Description snippet if present */}
        {product.description && (
          <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-2">
            {product.description}
          </p>
        )}

        {/* Price & Stock */}
        <div className="mt-auto pt-1 flex items-baseline gap-2 mb-3">
          <span className="text-base font-semibold text-zinc-900 font-mono">
            {formatCurrency(effectivePrice)}
          </span>
          {product.discountPrice && (
            <span className="text-xs text-zinc-400 line-through font-mono">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        {/* Fast Reorder 1-Click Button or Standard Add to Cart */}
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          size="sm"
          variant={added ? 'secondary' : 'default'}
          className={`w-full text-xs font-medium transition-all ${
            showReorder
              ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
              : ''
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {showReorder ? 'Reordered to Cart!' : 'Added to Cart'}
            </>
          ) : isOutOfStock ? (
            'Out of Stock'
          ) : showReorder ? (
            <>
              <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Reorder 1-Click
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
