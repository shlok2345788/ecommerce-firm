import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateWhatsAppOrderLink } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const store = await prisma.store.findUnique({
      where: { slug },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Cannot place orders on a suspended store' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { customerName, customerPhone, shippingAddress, paymentMethod, items } = body;

    if (!customerName || !customerPhone || !shippingAddress) {
      return NextResponse.json(
        { error: 'Name, phone number, and delivery address are required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Please select products to order.' },
        { status: 400 }
      );
    }

    // Fetch products to verify pricing and stock
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
        isActive: true,
      },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json(
        { error: 'One or more items in your cart are no longer available.' },
        { status: 400 }
      );
    }

    // Calculate total amount and assemble line items
    let grandTotal = 0;
    const orderItemsData: Array<{
      productId: string;
      quantity: number;
      price: number;
      title: string;
    }> = [];

    for (const item of items) {
      const prod = dbProducts.find((p) => p.id === item.productId);
      if (!prod) continue;

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const effectivePrice = prod.discountPrice ? Number(prod.discountPrice) : Number(prod.price);
      grandTotal += effectivePrice * qty;

      orderItemsData.push({
        productId: prod.id,
        quantity: qty,
        price: effectivePrice,
        title: prod.title,
      });
    }

    // Customer authentication is required to track sales and repeated orders
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.userId) {
      return NextResponse.json(
        { error: 'Customer account required. Please sign in or register before completing your order.' },
        { status: 401 }
      );
    }

    const customer = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer account not found. Please log in again.' },
        { status: 401 }
      );
    }

    // Associate registeredStoreId if not yet set
    if (!customer.registeredStoreId) {
      await prisma.user.update({
        where: { id: customer.id },
        data: { registeredStoreId: store.id },
      });
    }

    // Save phone to customer profile if provided and not yet stored
    if (customerPhone && !customer.phone) {
      await prisma.user.update({
        where: { id: customer.id },
        data: { phone: customerPhone.trim() },
      });
    }

    const customerId = customer.id;

    // Create Order and items in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          storeId: store.id,
          customerId,
          customerName: customerName.trim() || customer.name,
          customerPhone: customerPhone.trim() || customer.phone || '',
          shippingAddress: shippingAddress.trim(),
          totalAmount: grandTotal,
          status: 'PENDING',
          paymentMethod: paymentMethod || 'Cash on Delivery (COD)',
          items: {
            create: orderItemsData.map((oi) => ({
              productId: oi.productId,
              quantity: oi.quantity,
              price: oi.price,
            })),
          },
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

      // Decrement stock for ordered products
      for (const oi of orderItemsData) {
        await tx.product.update({
          where: { id: oi.productId },
          data: {
            stock: {
              decrement: oi.quantity,
            },
          },
        });
      }

      return order;
    });

    // Generate WhatsApp direct link to merchant
    const whatsAppLink = generateWhatsAppOrderLink(
      store.phone,
      {
        id: newOrder.id,
        customerName: newOrder.customerName,
        shippingAddress: newOrder.shippingAddress,
        totalAmount: Number(newOrder.totalAmount),
        paymentMethod: newOrder.paymentMethod,
        items: orderItemsData,
      },
      store.name
    );

    return NextResponse.json({
      success: true,
      order: newOrder,
      store: {
        name: store.name,
        phone: store.phone,
        slug: store.slug,
      },
      whatsAppLink,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to process order. Please try again.' },
      { status: 500 }
    );
  }
}
