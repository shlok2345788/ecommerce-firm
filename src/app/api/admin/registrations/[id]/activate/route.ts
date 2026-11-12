import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    const registration = await prisma.storeRegistration.findUnique({
      where: { id },
      include: { createdStore: true, storeAccount: true },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (!registration.createdStoreId) {
      return NextResponse.json(
        { error: 'Cannot reactivate a registration that has not been approved.' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.storeRegistration.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      await tx.store.update({
        where: { id: registration.createdStoreId! },
        data: { status: 'ACTIVE' },
      });

      if (registration.storeAccount) {
        await tx.storeAccount.update({
          where: { id: registration.storeAccount.id },
          data: { accountStatus: 'ACTIVE' },
        });
      }

      if (registration.createdUserId) {
        await tx.user.update({
          where: { id: registration.createdUserId },
          data: { status: 'ACTIVE' },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'STORE_REACTIVATED',
          entityType: 'StoreRegistration',
          entityId: id,
          actorId: adminUser.userId,
          actorEmail: adminUser.email,
          actorRole: adminUser.role,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Store has been reactivated successfully.',
    });
  } catch (error: any) {
    console.error('Reactivate store error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate store' },
      { status: 500 }
    );
  }
}
