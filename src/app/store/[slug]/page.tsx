'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductCard, { ProductProps } from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import CustomerAuthModal from '@/components/CustomerAuthModal';
import {
  Phone,
  MapPin,
  AlertCircle,
  Package,
  Sparkles,
  ArrowRight,
  User,
  ShoppingBag,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function StoreFrontPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // Store data
  const [storeData, setStoreData] = useState<any>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Customer state
  const [customer, setCustomer] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Tabs: 'recommended' (Express View) vs 'all' (All Products)
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');

  // Recommended Tab State
  const [recommendedProducts, setRecommendedProducts] = useState<ProductProps[]>([]);
  const [recommendedMeta, setRecommendedMeta] = useState<any>(null);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  // All Products Tab State
  const [catalogProducts, setCatalogProducts] = useState<ProductProps[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('newest');
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Quick view
  const [quickViewProduct, setQuickViewProduct] = useState<ProductProps | null>(null);

  // Synchronize initial search parameter
  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
      setActiveTab('all');
    }
  }, [initialSearch]);

  // 1. Check Customer Auth State
  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/store/${slug}/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      }
    } catch (e) {
      setCustomer(null);
    }
  };

  useEffect(() => {
    fetchCustomer();
    const handleAuthChange = () => fetchCustomer();
    window.addEventListener('customer-auth-changed', handleAuthChange);
    return () => window.removeEventListener('customer-auth-changed', handleAuthChange);
  }, [slug]);

  // 2. Fetch Tab 1 Recommended Products (Express View)
  const fetchRecommended = async () => {
    try {
      setLoadingRecommended(true);
      const res = await fetch(`/api/store/${slug}/recommended`);
      if (res.ok) {
        const data = await res.json();
        setRecommendedProducts(data.products || []);
        setRecommendedMeta(data);
      }
    } catch (e) {
      console.error('Failed to load recommended items', e);
    } finally {
      setLoadingRecommended(false);
    }
  };

  useEffect(() => {
    fetchRecommended();
  }, [slug, customer]);

  // 3. Fetch Tab 2 All Products Catalog
  const fetchCatalog = async () => {
    try {
      setLoadingCatalog(true);
      const url = `/api/store/${slug}?category=${selectedCategory}&search=${encodeURIComponent(search)}&sort=${sortBy}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (data.isSuspended) {
          setIsSuspended(true);
          setStoreData({ name: data.storeName });
          return;
        }
        throw new Error(data.error || 'Failed to load catalog');
      }

      setStoreData(data.store);
      setCategories(data.categories || []);
      setCatalogProducts(data.products || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [slug, selectedCategory, search, sortBy]);

  if (isSuspended) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-xl bg-white border border-zinc-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 mb-1">
            Store Temporarily Unavailable
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {storeData?.name || 'This store'} is currently undergoing administrative review. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Store Header Banner (Clean, Anti-AI Muted Design) */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase tracking-wider">
              Verified Merchant
            </span>
            {customer ? (
              <Link
                href={`/store/${slug}/dashboard`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Signed in as {customer.name}</span>
                <span className="font-semibold underline ml-1">Open Dashboard →</span>
              </Link>
            ) : (
              <span className="text-[11px] text-zinc-500 flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-400">Account required to purchase:</span>
                <Link
                  href={`/store/${slug}/login`}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Sign In
                </Link>
                <span className="text-zinc-300">·</span>
                <Link
                  href={`/store/${slug}/register`}
                  className="font-semibold text-zinc-900 hover:underline"
                >
                  Register Account
                </Link>
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {storeData?.name || (loadingCatalog ? <Skeleton className="h-8 w-60" /> : 'Storefront')}
          </h1>
          <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">
            {storeData?.description || 'Browse our catalog and enjoy direct merchant fulfillment without third-party checkout fees.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-zinc-500">
            {storeData?.phone && (
              <span className="flex items-center gap-1.5 font-mono text-zinc-700">
                <Phone className="w-3.5 h-3.5 text-zinc-400" /> {storeData.phone}
              </span>
            )}
            {storeData?.address && (
              <span className="flex items-center gap-1.5 text-zinc-700">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {storeData.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Requirement: Customer Store Landing & Registration Flow */}
      {/* If not logged in, an elegant modal/banner presents "Login or Register to Shop" (Phone/Email + Password) */}
      {!customer && (
        <div className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-900 text-white uppercase tracking-wider">
                Customer Benefits
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-900">
                Login or Register to Shop
              </h2>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Create an account or sign in with your Phone or Email. Your profile is securely locked to our store for express 1-click reordering and order status updates.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link href={`/store/${slug}/login`} className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="sm"
                className="text-xs w-full sm:w-auto border-zinc-300 text-zinc-800 hover:bg-zinc-100 bg-white"
              >
                Sign In
              </Button>
            </Link>
            <Link href={`/store/${slug}/register`} className="flex-1 sm:flex-none">
              <Button
                size="sm"
                className="text-xs w-full sm:w-auto bg-zinc-900 text-white hover:bg-zinc-800"
              >
                Register to Shop <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Requirement: Two-Tab Customer Interface */}
      {/* Tab 1: "Recommended" (Express View) | Tab 2: "All Products" */}
      <div className="space-y-6">
        <div className="border-b border-zinc-200">
          <div className="flex items-center gap-8">
            {/* Tab 1 Trigger */}
            <button
              onClick={() => setActiveTab('recommended')}
              className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === 'recommended'
                  ? 'text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-zinc-900" />
              <span>Recommended</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-normal">
                Express View
              </span>
              {activeTab === 'recommended' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950" />
              )}
            </button>

            {/* Tab 2 Trigger */}
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>All Products</span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-800 font-normal">
                {catalogProducts.length}
              </span>
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950" />
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: RECOMMENDED (EXPRESS VIEW) */}
        {activeTab === 'recommended' && (
          <div className="space-y-6">
            {/* Header info describing the shelf */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-white border border-zinc-200">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  {recommendedMeta?.title || 'Express Reorder Shelf'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {recommendedMeta?.subtitle ||
                    'Fast 1-click reordering for your favorite items and top store selections.'}
                </p>
              </div>

              {!customer && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-zinc-500 hidden md:inline">
                    Have past orders?
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="text-xs h-8 border-zinc-300"
                  >
                    Sign in for personal reorders
                  </Button>
                </div>
              )}
            </div>

            {/* Recommended Products Grid */}
            {loadingRecommended ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 bg-white p-3 space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : recommendedProducts.length === 0 ? (
              <div className="py-16 text-center rounded-xl border border-zinc-200 bg-white p-8">
                <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">
                  No recommendations available yet
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                  Browse our full product catalog to start placing orders.
                </p>
                <Button
                  onClick={() => setActiveTab('all')}
                  size="sm"
                  className="text-xs bg-zinc-900 text-white"
                >
                  Explore All Products
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    isReorder={true}
                    badgeText={prod.badge}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL PRODUCTS */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            {/* Search, Category & Price Sorting Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 bg-white">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                    selectedCategory === 'all'
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                  }`}
                >
                  All Items
                </button>

                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                      selectedCategory === c.slug
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Price & Date Sorting */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                <span className="text-xs text-zinc-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="title-asc">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Catalog Grid */}
            {loadingCatalog ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 bg-white p-3 space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            ) : catalogProducts.length === 0 ? (
              <div className="py-20 text-center rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
                <Package className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-zinc-900 mb-1">
                  No active products found
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {search
                    ? `No products match "${search}". Try clearing your search.`
                    : 'This store currently has no active products listed. Check back later.'}
                </p>
                {search && (
                  <Button
                    onClick={() => setSearch('')}
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                  >
                    Clear Search Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {catalogProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Customer Auth Modal (Login / Register) */}
      <CustomerAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        storeSlug={slug}
        storeName={storeData?.name || 'Store'}
        initialMode={authMode}
        onSuccess={(cust) => {
          setCustomer(cust);
          window.dispatchEvent(new Event('customer-auth-changed'));
        }}
      />
    </div>
  );
}
