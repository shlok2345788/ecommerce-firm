import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized Superadmin access' }, { status: 403 });
    }

    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, name: true, email: true, status: true },
        },
        _count: {
          select: { products: true, orders: true, categories: true },
        },
      },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('Fetch stores error:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}
