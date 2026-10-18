import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateWhatsAppOrderLink } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; id: string } }
) {
  try {
    const { slug, id } = params;

    const store = await prisma.store.findUnique({
      where: { slug },
      select: { id: true, name: true, phone: true, slug: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, title: true, images: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const whatsAppLink = generateWhatsAppOrderLink(
      store.phone,
      {
        id: order.id,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        totalAmount: Number(order.totalAmount),
        paymentMethod: order.paymentMethod,
        items: order.items.map((i) => ({
          title: i.product?.title || 'Item',
          quantity: i.quantity,
          price: Number(i.price),
        })),
      },
      store.name
    );

    return NextResponse.json({
      order,
      store,
      whatsAppLink,
    });
  } catch (error) {
    console.error('Track order error:', error);
    return NextResponse.json({ error: 'Failed to look up order' }, { status: 500 });
  }
}
