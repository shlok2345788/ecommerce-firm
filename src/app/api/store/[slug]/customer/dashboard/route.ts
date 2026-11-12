import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sanitizeProductsForCustomer } from '@/lib/productFields';

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

    // Verify tenant isolation
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        registeredStoreId: true,
        firstLogin: true,
        mustChangePassword: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (dbUser.role === 'CUSTOMER' && dbUser.registeredStoreId && dbUser.registeredStoreId !== store.id) {
      return NextResponse.json(
        { error: 'Tenant isolation violation: you do not have permission to access another store dashboard.' },
        { status: 403 }
      );
    }

    // If first login is required, let the frontend know so it can redirect to /store/[slug]/first-login
    const mustChange = Boolean(dbUser.firstLogin || dbUser.mustChangePassword);

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

    const reorderProducts = await Promise.all(Array.from(productMap.values()).map(
      async ({ product, orderCount, totalQuantity, lastOrderedAt }) => ({
        ...(await sanitizeProductsForCustomer([product]))[0],
        isReorderItem: true,
        badge: orderCount > 1 ? `Ordered ${orderCount}×` : 'Previously Purchased',
        orderCount,
        totalQuantity,
        lastOrderedAt,
      })
    ));

    return NextResponse.json({
      store,
      customer: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone || 'N/A',
        firstLogin: mustChange,
        mustChangePassword: mustChange,
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
