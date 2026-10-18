import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized Admin access' }, { status: 403 });
    }

    const store = await prisma.store.findFirst({
      where: { adminId: user.userId },
      include: {
        _count: {
          select: {
            products: true,
            categories: true,
            orders: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found for this admin' }, { status: 404 });
    }

    // Calculate revenue & pending orders
    const ordersAgg = await prisma.order.aggregate({
      where: { storeId: store.id },
      _sum: { totalAmount: true },
    });

    const pendingOrdersCount = await prisma.order.count({
      where: { storeId: store.id, status: 'PENDING' },
    });

    return NextResponse.json({
      store,
      metrics: {
        totalRevenue: Number(ordersAgg._sum.totalAmount || 0),
        pendingOrders: pendingOrdersCount,
      },
    });
  } catch (error) {
    console.error('Fetch store error:', error);
    return NextResponse.json({ error: 'Failed to retrieve store info' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized Admin access' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, logoUrl, description, phone, address } = body;

    const existingStore = await prisma.store.findFirst({
      where: { adminId: user.userId },
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Check slug uniqueness if changed
    let cleanedSlug = existingStore.slug;
    if (slug && slug.trim() !== existingStore.slug) {
      cleanedSlug = slugify(slug);
      const conflict = await prisma.store.findFirst({
        where: {
          slug: cleanedSlug,
          NOT: { id: existingStore.id },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: `Store slug "${cleanedSlug}" is already taken by another store` },
          { status: 400 }
        );
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: existingStore.id },
      data: {
        name: name ? name.trim() : existingStore.name,
        slug: cleanedSlug,
        logoUrl: logoUrl !== undefined ? logoUrl?.trim() || null : existingStore.logoUrl,
        description: description !== undefined ? description?.trim() || null : existingStore.description,
        phone: phone ? phone.trim() : existingStore.phone,
        address: address !== undefined ? address?.trim() || null : existingStore.address,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Store settings saved successfully',
      store: updatedStore,
    });
  } catch (error) {
    console.error('Update store error:', error);
    return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
  }
}
