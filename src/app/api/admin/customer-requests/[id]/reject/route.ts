import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendCustomerRejectedEmail } from '@/lib/email';

export const runtime = 'nodejs';

async function getAdminStoreId(adminUserId: string, fallbackStoreId?: string) {
  if (fallbackStoreId) return fallbackStoreId;
  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { stores: { take: 1, select: { id: true } } },
  });
  return user?.stores[0]?.id;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getAdminStoreId(adminUser.userId, adminUser.storeId);
    const { id } = params;

    const request = await prisma.customerRegistrationRequest.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!request) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    if (request.storeId !== storeId && adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Tenant isolation violation: unauthorized access.' }, { status: 403 });
    }

    const { rejectionReason } = await req.json();
    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is mandatory' }, { status: 400 });
    }

    const updated = await prisma.customerRegistrationRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        reviewedAt: new Date(),
        reviewedBy: adminUser.name || adminUser.email,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_REGISTRATION_REJECTED',
        entityType: 'CustomerRegistrationRequest',
        entityId: id,
        actorId: adminUser.userId,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        details: { rejectionReason: rejectionReason.trim(), storeId: request.storeId },
      },
    });

    // Notify customer
    try {
      await sendCustomerRejectedEmail({
        email: request.email,
        customerName: request.fullName,
        storeName: request.store.name,
        reason: rejectionReason.trim(),
      });
    } catch (e: any) {
      console.warn('Rejection notification dispatch warning:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Registration request rejected',
      request: updated,
    });
  } catch (error: any) {
    console.error('Reject customer request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject registration' },
      { status: 500 }
    );
  }
}

