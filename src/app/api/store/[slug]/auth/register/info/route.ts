import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cleanIndianPhone } from '@/lib/registrationValidators';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const { applicationId, identifier, responseMessage } = await req.json();
    if (!applicationId || !identifier || !responseMessage?.trim()) {
      return NextResponse.json(
        { error: 'Application ID, registered email or phone, and response are required' },
        { status: 400 }
      );
    }

    const request = await prisma.customerRegistrationRequest.findFirst({
      where: { applicationId, storeId: store.id },
    });
    if (!request) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const matchesEmail = request.email.toLowerCase() === normalizedIdentifier;
    const matchesPhone = request.phone === cleanIndianPhone(String(identifier));
    if (!matchesEmail && !matchesPhone) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }
    if (request.status !== 'ADDITIONAL_INFO_REQUIRED') {
      return NextResponse.json({ error: 'Additional information is not currently requested' }, { status: 400 });
    }

    const updated = await prisma.customerRegistrationRequest.update({
      where: { id: request.id },
      data: { applicantResponse: String(responseMessage).trim(), status: 'UNDER_REVIEW' },
    });
    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_APPLICANT_INFO_SUBMITTED',
        entityType: 'CustomerRegistrationRequest',
        entityId: request.id,
        actorEmail: request.email,
        actorRole: 'APPLICANT',
        details: { storeId: store.id },
      },
    });
    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    console.error('Customer additional info submission error:', error);
    return NextResponse.json({ error: 'Failed to submit additional information' }, { status: 500 });
  }
}
