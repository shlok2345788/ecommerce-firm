import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendStoreSuspendedEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const { reason } = body;

    const registration = await prisma.storeRegistration.findUnique({
      where: { id },
      include: { createdStore: true, storeAccount: true },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (!registration.createdStoreId) {
      return NextResponse.json(
        { error: 'Cannot suspend a registration that does not have an active store provisioned.' },
        { status: 400 }
      );
    }

    // Suspend store, storeAccount, and user atomically
    await prisma.$transaction(async (tx) => {
      await tx.storeRegistration.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          adminNotes: reason ? `Suspension reason: ${reason}` : undefined,
        },
      });

      await tx.store.update({
        where: { id: registration.createdStoreId! },
        data: { status: 'SUSPENDED' },
      });

      if (registration.storeAccount) {
        await tx.storeAccount.update({
          where: { id: registration.storeAccount.id },
          data: { accountStatus: 'INACTIVE' },
        });
      }

      if (registration.createdUserId) {
        await tx.user.update({
          where: { id: registration.createdUserId },
          data: { status: 'INACTIVE' },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'STORE_SUSPENDED',
          entityType: 'StoreRegistration',
          entityId: id,
          actorId: adminUser.userId,
          actorEmail: adminUser.email,
          actorRole: adminUser.role,
          details: {
            storeId: registration.createdStoreId,
            reason: reason || 'Suspended by administration',
          },
        },
      });
    });

    // Dispatch suspension notice
    await sendStoreSuspendedEmail({
      email: registration.email,
      ownerName: registration.ownerName,
      storeName: registration.storeName,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Store has been suspended.',
    });
  } catch (error: any) {
    console.error('Suspend store error:', error);
    return NextResponse.json(
      { error: 'Failed to suspend store' },
      { status: 500 }
    );
  }
}
