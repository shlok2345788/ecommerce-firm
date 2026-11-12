import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { sendAdditionalInfoRequestedEmail } from '@/lib/email';

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
    const { requestMessage } = await req.json();

    if (!requestMessage || typeof requestMessage !== 'string' || requestMessage.trim().length < 5) {
      return NextResponse.json(
        { error: 'A clear message describing the required additional information is required' },
        { status: 400 }
      );
    }

    const registration = await prisma.storeRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const updated = await prisma.storeRegistration.update({
      where: { id },
      data: {
        status: 'ADDITIONAL_INFO_REQUIRED',
        additionalInfoRequest: requestMessage.trim(),
        reviewedAt: new Date(),
        reviewedBy: adminUser.name || adminUser.email,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADDITIONAL_INFO_REQUESTED',
        entityType: 'StoreRegistration',
        entityId: id,
        actorId: adminUser.userId,
        actorEmail: adminUser.email,
        actorRole: adminUser.role,
        details: { requestMessage: requestMessage.trim() },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackingUrl = `${appUrl.replace(/\/$/, '')}/register/track?appId=${encodeURIComponent(registration.applicationId)}&id=${encodeURIComponent(registration.email)}`;

    await sendAdditionalInfoRequestedEmail({
      email: registration.email,
      ownerName: registration.ownerName,
      storeName: registration.storeName,
      applicationId: registration.applicationId,
      requestMessage: requestMessage.trim(),
      trackingUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Additional information request logged and email sent to applicant.',
      registration: updated,
    });
  } catch (error: any) {
    console.error('Request info error:', error);
    return NextResponse.json(
      { error: 'Failed to request additional information' },
      { status: 500 }
    );
  }
}
