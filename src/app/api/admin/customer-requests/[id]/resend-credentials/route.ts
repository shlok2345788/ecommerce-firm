import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { generateCompliantTemporaryPassword } from '@/lib/registrationValidators';
import { sendCustomerApprovedEmail } from '@/lib/email';

export const runtime = 'nodejs';

async function getAdminStore(adminUserId: string, fallbackStoreId?: string) {
  if (fallbackStoreId) {
    return prisma.store.findUnique({
      where: { id: fallbackStoreId },
      select: { id: true, name: true, slug: true },
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { stores: { take: 1, select: { id: true, name: true, slug: true } } },
  });
  return user?.stores[0] || null;
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

    const currentStore = await getAdminStore(adminUser.userId, adminUser.storeId);
    if (!currentStore) {
      return NextResponse.json({ error: 'No associated store found' }, { status: 404 });
    }

    const { id } = params;

    const request = await prisma.customerRegistrationRequest.findUnique({
      where: { id },
      include: {
        createdCustomer: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    if (request.storeId !== currentStore.id && adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Tenant isolation violation: unauthorized access.' }, { status: 403 });
    }

    if (request.status !== 'APPROVED' || !request.createdCustomer) {
      return NextResponse.json(
        { error: 'Cannot resend credentials for an unapproved application' },
        { status: 400 }
      );
    }

    const newTempPassword = generateCompliantTemporaryPassword(10);
    const newHash = await hashPassword(newTempPassword);

    await prisma.user.update({
      where: { id: request.createdCustomer.id },
      data: {
        passwordHash: newHash,
        firstLogin: true,
        mustChangePassword: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_CREDENTIALS_REISSUED',
        entityType: 'CustomerRegistrationRequest',
        entityId: request.id,
        actorId: adminUser.userId,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        details: { customerId: request.createdCustomer.id },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const storeLoginUrl = `${appUrl.replace(/\/$/, '')}/store/${currentStore.slug}/login`;

    let emailSent = false;
    let emailError: string | undefined;

    try {
      const emailResult = await sendCustomerApprovedEmail({
        email: request.email,
        customerName: request.fullName,
        storeName: currentStore.name,
        loginId: request.createdCustomer.loginId || request.phone,
        temporaryPassword: newTempPassword,
        loginUrl: storeLoginUrl,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
    } catch (e: any) {
      emailError = e.message;
    }

    return NextResponse.json({
      success: true,
      message: 'New credentials generated successfully',
      credentials: {
        loginId: request.createdCustomer.loginId || request.phone,
        temporaryPassword: newTempPassword,
        email: request.email,
        storeLoginUrl,
      },
      emailDelivery: {
        sent: emailSent,
        error: emailError,
      },
    });
  } catch (error: any) {
    console.error('Resend customer credentials error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend credentials' },
      { status: 500 }
    );
  }
}

