import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

async function getAdminStoreId(adminUserId: string, fallbackStoreId?: string) {
  if (fallbackStoreId) return fallbackStoreId;
  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { stores: { take: 1, select: { id: true } } },
  });
  return user?.stores[0]?.id;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getAdminStoreId(adminUser.userId, adminUser.storeId);
    if (!storeId) {
      return NextResponse.json({ error: 'No associated store found' }, { status: 404 });
    }

    const { id } = params;

    const request = await prisma.customerRegistrationRequest.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, slug: true } },
        createdCustomer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            loginId: true,
            status: true,
            firstLogin: true,
            mustChangePassword: true,
            createdAt: true,
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    // Tenant isolation verification: Request MUST belong to this admin's store
    if (request.storeId !== storeId && adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Tenant isolation violation: you do not have permission to view this customer request.' },
        { status: 403 }
      );
    }

    // Fetch related audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'CustomerRegistrationRequest',
        entityId: request.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      request,
      auditLogs,
    });
  } catch (error: any) {
    console.error('Fetch customer request detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve request details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const existing = await prisma.customerRegistrationRequest.findUnique({
      where: { id },
      select: { id: true, storeId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (existing.storeId !== storeId && adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized access to this store record' }, { status: 403 });
    }

    const { adminNotes } = await req.json();

    const updated = await prisma.customerRegistrationRequest.update({
      where: { id },
      data: { adminNotes },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_ADMIN_NOTES_UPDATED',
        entityType: 'CustomerRegistrationRequest',
        entityId: id,
        actorId: adminUser.userId,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        details: { adminNotes },
      },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Update notes error:', error);
    return NextResponse.json({ error: 'Failed to update admin notes' }, { status: 500 });
  }
}

