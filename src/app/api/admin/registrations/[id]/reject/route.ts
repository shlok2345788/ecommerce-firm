import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendRegistrationRejectedEmail } from '@/lib/email';

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
    const { rejectionReason } = await req.json();

    if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 5) {
      return NextResponse.json(
        { error: 'A mandatory rejection reason is required (minimum 5 characters)' },
        { status: 400 }
      );
    }

    const registration = await prisma.storeRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (registration.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Cannot reject an already approved store. Use Suspend Store instead.' },
        { status: 400 }
      );
    }

    const updated = await prisma.storeRegistration.update({
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
        action: 'REGISTRATION_REJECTED',
        entityType: 'StoreRegistration',
        entityId: id,
        actorId: adminUser.userId,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        details: { rejectionReason: rejectionReason.trim() },
      },
    });

    // Dispatch rejection email
    await sendRegistrationRejectedEmail({
      email: registration.email,
      ownerName: registration.ownerName,
      storeName: registration.storeName,
      applicationId: registration.applicationId,
      reason: rejectionReason.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Registration rejected and notification dispatched.',
      registration: updated,
    });
  } catch (error: any) {
    console.error('Reject registration error:', error);
    return NextResponse.json(
      { error: 'Failed to reject registration' },
      { status: 500 }
    );
  }
}
