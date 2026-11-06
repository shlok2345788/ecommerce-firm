import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CartProvider } from '@/lib/cartContext';
import CartDrawer from '@/components/CartDrawer';
import StoreHeader from '@/components/StoreHeader';
import StoreFooter from '@/components/StoreFooter';

async function getStore(slug: string) {
  const backendUrl = process.env.BACKEND_URL?.replace(/\/$/, '');
  if (!backendUrl) {
    return prisma.store.findUnique({ where: { slug } });
  }

  const response = await fetch(`${backendUrl}/api/store/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load storefront metadata (${response.status})`);
  }

  const data = await response.json();
  return data.store;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug);

  if (!store) return { title: 'Store Not Found' };

  return {
    title: `${store.name} | Official Storefront`,
    description: store.description || `Browse products and order directly from ${store.name}`,
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { slug } = params;
  const store = await getStore(slug);

  if (!store) {
    notFound();
  }

  return (
    <CartProvider storeSlug={slug}>
      <div className="min-h-screen flex flex-col bg-zinc-50/70 text-zinc-900">
        <StoreHeader store={store} />
        <main className="flex-1">{children}</main>
        <StoreFooter store={store} />
        <CartDrawer storeSlug={slug} />
      </div>
    </CartProvider>
  );
}
