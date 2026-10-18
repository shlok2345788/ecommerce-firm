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
      select: { id: true, name: true, slug: true, logoUrl: true, phone: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch customer's orders for this store
    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        OR: [
          { customerId: user.userId },
          ...(user.phone ? [{ customerPhone: user.phone }] : []),
        ],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                images: true,
                price: true,
                discountPrice: true,
                stock: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute stats
    const totalOrders = orders.length;
    let lifetimeSpent = 0;
    let activeOrdersCount = 0;

    const productMap = new Map<string, {
      product: any;
      orderCount: number;
      totalQuantity: number;
      lastOrderedAt: Date;
    }>();

    for (const order of orders) {
      lifetimeSpent += Number(order.totalAmount);
      if (['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY'].includes(order.status)) {
        activeOrdersCount += 1;
      }

      for (const item of order.items) {
        if (!item.product || !item.product.isActive) continue;
        const pId = item.productId;
        const existing = productMap.get(pId);
        if (existing) {
          existing.orderCount += 1;
          existing.totalQuantity += item.quantity;
          if (new Date(order.createdAt) > new Date(existing.lastOrderedAt)) {
            existing.lastOrderedAt = order.createdAt;
          }
        } else {
          productMap.set(pId, {
            product: item.product,
            orderCount: 1,
            totalQuantity: item.quantity,
            lastOrderedAt: order.createdAt,
          });
        }
      }
    }

    const reorderProducts = Array.from(productMap.values()).map(
      ({ product, orderCount, totalQuantity, lastOrderedAt }) => ({
        ...product,
        price: Number(product.price),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        isReorderItem: true,
        badge: orderCount > 1 ? `Ordered ${orderCount}×` : 'Previously Purchased',
        orderCount,
        totalQuantity,
        lastOrderedAt,
      })
    );

    return NextResponse.json({
      store,
      customer: {
        id: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone || 'N/A',
      },
      stats: {
        totalOrders,
        lifetimeSpent,
        activeOrders: activeOrdersCount,
      },
      reorderProducts,
      orders: orders.map((o) => ({
        id: o.id,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        paymentMethod: o.paymentMethod,
        shippingAddress: o.shippingAddress,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          title: i.product?.title || 'Product',
          image: i.product?.images?.[0] || null,
          quantity: i.quantity,
          price: Number(i.price),
          subtotal: Number(i.price) * i.quantity,
        })),
      })),
    });
  } catch (error) {
    console.error('Customer dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to load customer dashboard' },
      { status: 500 }
    );
  }
}
