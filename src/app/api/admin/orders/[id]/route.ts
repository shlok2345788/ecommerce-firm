import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const store = await prisma.store.findFirst({
      where: { adminId: user.userId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const updated = await prisma.order.updateMany({
      where: { id, storeId: store.id },
      data: { status },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
