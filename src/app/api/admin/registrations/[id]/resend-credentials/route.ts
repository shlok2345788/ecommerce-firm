import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { generateCompliantTemporaryPassword } from '@/lib/registrationValidators';
import { sendRegistrationApprovedEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== 'SUPERADMIN' && adminUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const registration = await prisma.storeRegistration.findUnique({
      where: { id },
      include: { createdStore: true, storeAccount: true, createdUser: true },
    });

    if (!registration || !registration.createdStore || !registration.createdUser) {
      return NextResponse.json(
        { error: 'Cannot resend credentials: Store account has not been provisioned.' },
        { status: 400 }
      );
    }

    // Only allow temporary password reset/resend if the user has NOT changed their password yet
    if (!registration.createdUser.firstLogin && !registration.createdUser.mustChangePassword) {
      return NextResponse.json(
        { error: 'The store owner has already activated their account and set their personal password. Cannot resend temporary credentials.' },
        { status: 400 }
      );
    }

    // Generate a fresh temporary password
    const newTempPassword = generateCompliantTemporaryPassword(12);
    const passwordHash = await hashPassword(newTempPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: registration.createdUser.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          firstLogin: true,
        },
      }),
      prisma.storeAccount.update({
        where: { storeId: registration.createdStore.id },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREDENTIALS_RESENT',
          entityType: 'StoreRegistration',
          entityId: id,
          actorId: adminUser.userId,
          actorEmail: adminUser.email,
          actorRole: adminUser.role,
        },
      }),
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl.replace(/\/$/, '')}/login`;

    const emailResult = await sendRegistrationApprovedEmail({
      email: registration.email,
      ownerName: registration.ownerName,
      storeName: registration.storeName,
      storeId: registration.createdStore.id,
      storeSlug: registration.createdStore.slug,
      loginId: registration.createdUser.loginId || registration.email,
      temporaryPassword: newTempPassword,
      loginUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'New temporary credentials generated and dispatched.',
      temporaryPassword: newTempPassword,
      loginId: registration.createdUser.loginId || registration.email,
      emailSent: emailResult.success,
    });
  } catch (error: any) {
    console.error('Resend credentials error:', error);
    return NextResponse.json(
      { error: 'Failed to resend credentials' },
      { status: 500 }
    );
  }
}

