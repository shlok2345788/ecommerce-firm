import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const store = await prisma.store.findFirst({
      where: { adminId: user.userId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { title: true } },
          },
        },
      },
    });

    // Generate CSV
    const headers = [
      'Order ID',
      'Created At',
      'Customer Name',
      'Customer Phone',
      'Shipping Address',
      'Payment Method',
      'Status',
      'Total Amount (₹)',
      'Items Count',
      'Items Summary',
    ];

    const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

    const rows = orders.map((o) => {
      const itemsSummary = o.items
        .map((item) => `${item.product?.title || 'Product'} (x${item.quantity})`)
        .join('; ');

      return [
        escapeCsv(o.id),
        escapeCsv(new Date(o.createdAt).toISOString()),
        escapeCsv(o.customerName),
        escapeCsv(o.customerPhone),
        escapeCsv(o.shippingAddress),
        escapeCsv(o.paymentMethod),
        escapeCsv(o.status),
        Number(o.totalAmount).toFixed(2),
        o.items.length,
        escapeCsv(itemsSummary),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${store.slug}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export orders error:', error);
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 });
  }
}
