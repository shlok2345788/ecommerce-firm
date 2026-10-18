import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const store = await prisma.store.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Store is suspended' }, { status: 403 });
    }

    const currentUser = await getCurrentUser();

    // 1. If customer is authenticated, query Order and OrderItem models for products previously purchased by customerId at this storeId
    if (currentUser?.userId) {
      const priorOrderItems = await prisma.orderItem.findMany({
        where: {
          order: {
            storeId: store.id,
            customerId: currentUser.userId,
            status: { not: 'CANCELLED' },
          },
          product: {
            isActive: true,
          },
        },
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          order: {
            select: { id: true, createdAt: true },
          },
        },
        orderBy: {
          order: {
            createdAt: 'desc',
          },
        },
      });

      if (priorOrderItems.length > 0) {
        // Aggregate distinct products with purchase stats
        const productMap = new Map<string, {
          product: any;
          orderCount: number;
          totalQuantity: number;
          lastOrderedAt: Date;
        }>();

        for (const item of priorOrderItems) {
          if (!item.product) continue;
          const pId = item.productId;
          const existing = productMap.get(pId);
          if (existing) {
            existing.orderCount += 1;
            existing.totalQuantity += item.quantity;
            if (new Date(item.order.createdAt) > new Date(existing.lastOrderedAt)) {
              existing.lastOrderedAt = item.order.createdAt;
            }
          } else {
            productMap.set(pId, {
              product: item.product,
              orderCount: 1,
              totalQuantity: item.quantity,
              lastOrderedAt: item.order.createdAt,
            });
          }
        }

        const reorderProducts = Array.from(productMap.values()).map(({ product, orderCount, totalQuantity, lastOrderedAt }) => ({
          ...product,
          price: Number(product.price),
          discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
          isReorderItem: true,
          badge: orderCount > 1 ? `Ordered ${orderCount}×` : 'Previously Purchased',
          orderCount,
          totalQuantity,
          lastOrderedAt,
        }));

        return NextResponse.json({
          source: 'reorder',
          title: 'Your Express Reorder Shelf',
          subtitle: 'Items you previously ordered from this store. Click to reorder in 1-click.',
          products: reorderProducts,
          isCustomerLoggedIn: true,
          hasPriorOrders: true,
        });
      }
    }

    // 2. If no prior orders exist or not logged in, render curated featured items with friendly badge ("Top Sellers")
    const topGroups = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId: store.id,
          status: { not: 'CANCELLED' },
        },
        product: {
          isActive: true,
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 8,
    });

    let featuredProducts: any[] = [];

    if (topGroups.length > 0) {
      const topIds = topGroups.map((g) => g.productId);
      const dbProducts = await prisma.product.findMany({
        where: {
          id: { in: topIds },
          storeId: store.id,
          isActive: true,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });

      // Preserve top ranking order
      featuredProducts = topIds
        .map((id) => dbProducts.find((p) => p.id === id))
        .filter(Boolean)
        .map((prod: any) => ({
          ...prod,
          price: Number(prod.price),
          discountPrice: prod.discountPrice ? Number(prod.discountPrice) : null,
          isReorderItem: false,
          badge: 'Top Sellers',
        }));
    }

    // Fallback if brand new store with zero orders
    if (featuredProducts.length === 0) {
      const fallbackProducts = await prisma.product.findMany({
        where: {
          storeId: store.id,
          isActive: true,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });

      featuredProducts = fallbackProducts.map((prod) => ({
        ...prod,
        price: Number(prod.price),
        discountPrice: prod.discountPrice ? Number(prod.discountPrice) : null,
        isReorderItem: false,
        badge: 'Top Sellers',
      }));
    }

    return NextResponse.json({
      source: 'top_sellers',
      title: 'Top Sellers & Merchant Favorites',
      subtitle: currentUser
        ? "You haven't ordered from this store yet. Here are our most popular items!"
        : 'Curated customer favorites for quick express ordering.',
      products: featuredProducts,
      isCustomerLoggedIn: Boolean(currentUser),
      hasPriorOrders: false,
    });
  } catch (error) {
    console.error('Recommended products error:', error);
    return NextResponse.json(
      { error: 'Failed to load recommendations' },
      { status: 500 }
    );
  }
}
