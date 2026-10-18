import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized Superadmin access' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid store status' }, { status: 400 });
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: { status },
      include: {
        admin: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, store: updatedStore });
  } catch (error) {
    console.error('Update store error:', error);
    return NextResponse.json({ error: 'Failed to update store status' }, { status: 500 });
  }
}
