import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cleanIndianPhone } from '@/lib/registrationValidators';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId')?.trim();
    const identifier = searchParams.get('identifier')?.trim();

    if (!applicationId || !identifier) {
      return NextResponse.json(
        { error: 'Application ID and registered email or phone number are required' },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const cleanedPhone = cleanIndianPhone(identifier);

    const registration = await prisma.storeRegistration.findUnique({
      where: { applicationId },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'No registration application found with the provided Application ID' },
        { status: 404 }
      );
    }

    // Verify ownership: identifier must match registered email or primaryPhone
    const matchesEmail = registration.email.toLowerCase() === normalizedIdentifier;
    const matchesPhone = registration.primaryPhone === cleanedPhone;

    if (!matchesEmail && !matchesPhone) {
      return NextResponse.json(
        { error: 'The provided email or phone does not match the registration records for this Application ID' },
        { status: 403 }
      );
    }

    // Return safe tracking view (never expose passwords, hashes, internal admin notes)
    return NextResponse.json({
      success: true,
      application: {
        applicationId: registration.applicationId,
        storeName: registration.storeName,
        ownerName: registration.ownerName,
        businessType: registration.businessType,
        email: registration.email,
        primaryPhone: registration.primaryPhone,
        city: registration.city,
        state: registration.state,
        status: registration.status,
        submittedAt: registration.submittedAt,
        reviewedAt: registration.reviewedAt,
        rejectionReason: registration.status === 'REJECTED' ? registration.rejectionReason : null,
        additionalInfoRequest:
          registration.status === 'ADDITIONAL_INFO_REQUIRED'
            ? registration.additionalInfoRequest
            : null,
        applicantResponse: registration.applicantResponse,
      },
    });
  } catch (error: any) {
    console.error('Track application error:', error);
    return NextResponse.json(
      { error: 'Internal server error while retrieving application status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, identifier, responseMessage } = body;

    if (!applicationId || !identifier || !responseMessage?.trim()) {
      return NextResponse.json(
        { error: 'Application ID, identifier, and response message are required' },
        { status: 400 }
      );
    }

    const normalizedIdentifier = identifier.toLowerCase().trim();
    const cleanedPhone = cleanIndianPhone(identifier);

    const registration = await prisma.storeRegistration.findUnique({
      where: { applicationId },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const matchesEmail = registration.email.toLowerCase() === normalizedIdentifier;
    const matchesPhone = registration.primaryPhone === cleanedPhone;

    if (!matchesEmail && !matchesPhone) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

    if (registration.status !== 'ADDITIONAL_INFO_REQUIRED') {
      return NextResponse.json(
        { error: `Cannot submit additional info when status is "${registration.status}"` },
        { status: 400 }
      );
    }

    const updated = await prisma.storeRegistration.update({
      where: { id: registration.id },
      data: {
        applicantResponse: responseMessage.trim(),
        status: 'UNDER_REVIEW',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'APPLICANT_INFO_SUBMITTED',
        entityType: 'StoreRegistration',
        entityId: registration.id,
        actorEmail: registration.email,
        actorRole: 'APPLICANT',
        details: {
          applicationId,
          responseMessage: responseMessage.trim(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Additional information successfully submitted. Application is now under review.',
      status: updated.status,
    });
  } catch (error: any) {
    console.error('Submit additional info error:', error);
    return NextResponse.json(
      { error: 'Failed to submit additional information' },
      { status: 500 }
    );
  }
}

