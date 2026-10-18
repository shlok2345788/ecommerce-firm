import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine store ID
    let storeId = user.storeId;
    if (!storeId) {
      const adminStore = await prisma.store.findFirst({
        where: { adminId: user.userId },
        select: { id: true },
      });
      storeId = adminStore?.id;
    }

    if (!storeId) {
      return NextResponse.json({ error: 'No associated store found' }, { status: 404 });
    }

    // Fetch registered customers for this store or customers who placed orders at this store
    const registeredCustomers = await prisma.user.findMany({
      where: {
        role: 'CUSTOMER',
        OR: [
          { registeredStoreId: storeId },
          { customerOrders: { some: { storeId } } },
        ],
      },
      include: {
        customerOrders: {
          where: { storeId },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, title: true, images: true, price: true, discountPrice: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalLifetimeRevenue = 0;
    let totalCustomerOrdersCount = 0;
    let customersWithAtLeastOneOrder = 0;
    let repeatCustomersCount = 0;

    const customersData = registeredCustomers.map((cust) => {
      const orders = cust.customerOrders || [];
      const totalOrdersPlaced = orders.length;

      let customerLifetimeSpent = 0;
      const productAggregateMap = new Map<string, {
        productId: string;
        title: string;
        image: string | null;
        totalQuantity: number;
        totalSpent: number;
      }>();

      for (const order of orders) {
        const orderTotal = Number(order.totalAmount);
        customerLifetimeSpent += orderTotal;

        for (const item of order.items) {
          const pId = item.productId;
          const price = Number(item.price);
          const qty = item.quantity;
          const existing = productAggregateMap.get(pId);

          if (existing) {
            existing.totalQuantity += qty;
            existing.totalSpent += price * qty;
          } else {
            productAggregateMap.set(pId, {
              productId: pId,
              title: item.product?.title || 'Unknown Product',
              image: item.product?.images?.[0] || null,
              totalQuantity: qty,
              totalSpent: price * qty,
            });
          }
        }
      }

      totalLifetimeRevenue += customerLifetimeSpent;
      totalCustomerOrdersCount += totalOrdersPlaced;

      if (totalOrdersPlaced >= 1) {
        customersWithAtLeastOneOrder += 1;
      }
      if (totalOrdersPlaced >= 2) {
        repeatCustomersCount += 1;
      }

      // Top 3 most frequently ordered items by this customer
      const top3Items = Array.from(productAggregateMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity || b.totalSpent - a.totalSpent)
        .slice(0, 3);

      const lastOrderDate = orders[0]?.createdAt || null;

      return {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        phone: cust.phone || orders[0]?.customerPhone || 'N/A',
        registeredAt: cust.createdAt,
        totalOrdersPlaced,
        lifetimeSpent: customerLifetimeSpent,
        lastOrderDate,
        top3Items,
        orders: orders.map((o) => ({
          id: o.id,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          paymentMethod: o.paymentMethod,
          shippingAddress: o.shippingAddress,
          customerPhone: o.customerPhone,
          createdAt: o.createdAt,
          itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
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
      };
    });

    const totalRegisteredCustomers = registeredCustomers.length;
    const repeatCustomerRate = customersWithAtLeastOneOrder > 0
      ? Number(((repeatCustomersCount / customersWithAtLeastOneOrder) * 100).toFixed(1))
      : 0;

    const averageOrderValue = totalCustomerOrdersCount > 0
      ? Number((totalLifetimeRevenue / totalCustomerOrdersCount).toFixed(2))
      : 0;

    const averageLifetimeSpent = totalRegisteredCustomers > 0
      ? Number((totalLifetimeRevenue / totalRegisteredCustomers).toFixed(2))
      : 0;

    return NextResponse.json({
      metrics: {
        totalRegisteredCustomers,
        repeatCustomerRate, // in percentage, e.g. 33.3
        averageOrderValue, // e.g. 112.50
        averageLifetimeSpent,
        totalRevenue: totalLifetimeRevenue,
        totalCustomerOrders: totalCustomerOrdersCount,
      },
      customers: customersData,
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customer analytics' },
      { status: 500 }
    );
  }
}
