import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status')?.trim();
    const search = searchParams.get('search')?.trim();

    // Query Metrics counts
    const [
      total,
      pending,
      underReview,
      additionalInfo,
      approved,
      rejected,
      suspended,
    ] = await Promise.all([
      prisma.storeRegistration.count(),
      prisma.storeRegistration.count({ where: { status: 'PENDING' } }),
      prisma.storeRegistration.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.storeRegistration.count({ where: { status: 'ADDITIONAL_INFO_REQUIRED' } }),
      prisma.storeRegistration.count({ where: { status: 'APPROVED' } }),
      prisma.storeRegistration.count({ where: { status: 'REJECTED' } }),
      prisma.storeRegistration.count({ where: { status: 'SUSPENDED' } }),
    ]);

    // Build where clause
    const where: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (search) {
      where.OR = [
        { applicationId: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { storeName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { primaryPhone: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    const registrations = await prisma.storeRegistration.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        createdStore: { select: { id: true, name: true, slug: true, status: true } },
        storeAccount: { select: { id: true, loginId: true, accountStatus: true, mustChangePassword: true, lastLoginAt: true } },
      },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        total,
        pending,
        underReview,
        additionalInfo,
        approved,
        rejected,
        suspended,
      },
      registrations,
    });
  } catch (error: any) {
    console.error('Fetch registrations error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve registrations' },
      { status: 500 }
    );
  }
}
