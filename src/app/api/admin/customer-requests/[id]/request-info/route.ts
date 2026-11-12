import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendCustomerAdditionalInfoRequestedEmail } from '@/lib/email';

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

    const { message } = await req.json();
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Information request message is required' }, { status: 400 });
    }

    const updated = await prisma.customerRegistrationRequest.update({
      where: { id },
      data: {
        status: 'ADDITIONAL_INFO_REQUIRED',
        additionalInfoRequest: message.trim(),
        reviewedAt: new Date(),
        reviewedBy: adminUser.name || adminUser.email,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_ADDITIONAL_INFO_REQUESTED',
        entityType: 'CustomerRegistrationRequest',
        entityId: id,
        actorId: adminUser.userId,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        details: { message: message.trim(), storeId: request.storeId },
      },
    });

    // Notify customer
    try {
      await sendCustomerAdditionalInfoRequestedEmail({
        email: request.email,
        customerName: request.fullName,
        storeName: request.store.name,
        message: message.trim(),
      });
    } catch (e: any) {
      console.warn('Info request notification dispatch warning:', e.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Additional information requested from applicant',
      request: updated,
    });
  } catch (error: any) {
    console.error('Request info error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to request additional information' },
      { status: 500 }
    );
  }
}

