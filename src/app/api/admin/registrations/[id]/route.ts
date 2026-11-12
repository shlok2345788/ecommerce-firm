import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const registration = await prisma.storeRegistration.findUnique({
      where: { id },
      include: {
        createdStore: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            phone: true,
            createdAt: true,
          },
        },
        createdUser: {
          select: {
            id: true,
            name: true,
            email: true,
            loginId: true,
            role: true,
            status: true,
            firstLogin: true,
            mustChangePassword: true,
          },
        },
        storeAccount: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Fetch related audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'StoreRegistration',
        entityId: registration.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      registration,
      auditLogs,
    });
  } catch (error: any) {
    console.error('Fetch registration detail error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve registration details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { adminNotes } = await req.json();

    const updated = await prisma.storeRegistration.update({
      where: { id },
      data: { adminNotes },
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_NOTES_UPDATED',
        entityType: 'StoreRegistration',
        entityId: id,
        actorId: user.userId,
        actorEmail: user.email,
        actorRole: user.role,
        details: { adminNotes },
      },
    });

    return NextResponse.json({ success: true, registration: updated });
  } catch (error: any) {
    console.error('Update notes error:', error);
    return NextResponse.json({ error: 'Failed to update admin notes' }, { status: 500 });
  }
}
