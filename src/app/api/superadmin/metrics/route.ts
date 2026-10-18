import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized Superadmin access' }, { status: 403 });
    }

    const [
      totalStores,
      totalAdmins,
      totalProducts,
      totalOrders,
      ordersAgg,
      ordersByStatus,
      recentStores,
      recentAdmins,
    ] = await Promise.all([
      prisma.store.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.store.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { name: true, email: true, status: true } },
          _count: { select: { products: true, orders: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          stores: { select: { id: true, name: true, slug: true, status: true } },
        },
      }),
    ]);

    const totalRevenue = Number(ordersAgg._sum.totalAmount || 0);

    return NextResponse.json({
      metrics: {
        totalStores,
        totalAdmins,
        totalProducts,
        totalOrders,
        totalRevenue,
      },
      ordersByStatus,
      recentStores,
      recentAdmins,
    });
  } catch (error) {
    console.error('Superadmin metrics error:', error);
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 });
  }
}
