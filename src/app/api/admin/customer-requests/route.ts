import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine target store
    let storeId = adminUser.storeId;
    if (!storeId) {
      const userWithStore = await prisma.user.findUnique({
        where: { id: adminUser.userId },
        include: { stores: { take: 1, select: { id: true, name: true, slug: true } } },
      });
      storeId = userWithStore?.stores[0]?.id;
    }

    if (!storeId) {
      return NextResponse.json({ error: 'No associated store found for this admin' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status')?.trim().toUpperCase() || 'ALL';

    const whereClause: any = {
      storeId,
    };

    if (statusFilter && statusFilter !== 'ALL') {
      whereClause.status = statusFilter;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { applicationId: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total, pending, underReview, additionalInfo, approved, rejected] =
      await Promise.all([
        prisma.customerRegistrationRequest.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          include: {
            createdCustomer: {
              select: {
                id: true,
                name: true,
                email: true,
                loginId: true,
                status: true,
                firstLogin: true,
                mustChangePassword: true,
              },
            },
          },
        }),
        prisma.customerRegistrationRequest.count({ where: { storeId } }),
        prisma.customerRegistrationRequest.count({ where: { storeId, status: 'PENDING' } }),
        prisma.customerRegistrationRequest.count({ where: { storeId, status: 'UNDER_REVIEW' } }),
        prisma.customerRegistrationRequest.count({ where: { storeId, status: 'ADDITIONAL_INFO_REQUIRED' } }),
        prisma.customerRegistrationRequest.count({ where: { storeId, status: 'APPROVED' } }),
        prisma.customerRegistrationRequest.count({ where: { storeId, status: 'REJECTED' } }),
      ]);

    return NextResponse.json({
      success: true,
      requests,
      metrics: {
        total,
        pending,
        underReview,
        additionalInfo,
        approved,
        rejected,
      },
    });
  } catch (error: any) {
    console.error('Fetch customer requests error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customer requests' },
      { status: 500 }
    );
  }
}

