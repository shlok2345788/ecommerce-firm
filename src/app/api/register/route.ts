import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  cleanIndianPhone,
  validateIndianPhone,
  validateEmail,
  validateGSTIN,
  BUSINESS_TYPES,
} from '@/lib/registrationValidators';
import { sendRegistrationSubmittedEmail } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';

function generateApplicationId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REG-${dateStr}-${randomHex}`;
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload' },
        { status: 400 }
      );
    }

    const {
      ownerName,
      storeName,
      primaryPhone,
      additionalPhones,
      gstNumber,
      email,
      businessType,
      businessDescription,
      buildingNumber,
      streetArea,
      city,
      state,
      pinCode,
      country = 'India',
      termsAccepted,
    } = body;

    // 1. Mandatory Fields Validation
    if (!ownerName || typeof ownerName !== 'string' || ownerName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Owner / Contact Person Name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!storeName || typeof storeName !== 'string' || storeName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Store / Business Name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'A valid business email address is required' },
        { status: 400 }
      );
    }

    if (!primaryPhone || !validateIndianPhone(primaryPhone)) {
      return NextResponse.json(
        { error: 'A valid 10-digit Indian primary phone number is required' },
        { status: 400 }
      );
    }

    const cleanedPrimaryPhone = cleanIndianPhone(primaryPhone);

    // Validate additional phones if provided
    const validAdditionalPhones: string[] = [];
    if (Array.isArray(additionalPhones)) {
      for (const phone of additionalPhones) {
        if (typeof phone === 'string' && phone.trim()) {
          if (!validateIndianPhone(phone)) {
            return NextResponse.json(
              { error: `Additional phone "${phone}" must be a valid 10-digit Indian number` },
              { status: 400 }
            );
          }
          const cleaned = cleanIndianPhone(phone);
          if (cleaned !== cleanedPrimaryPhone && !validAdditionalPhones.includes(cleaned)) {
            validAdditionalPhones.push(cleaned);
          }
        }
      }
    }

    // Validate GSTIN if provided
    if (gstNumber && !validateGSTIN(gstNumber)) {
      return NextResponse.json(
        { error: 'Invalid GSTIN format. Expected 15-character alphanumeric format (e.g. 22AAAAA0000A1Z5)' },
        { status: 400 }
      );
    }

    // Validate Business Type
    if (!businessType || !BUSINESS_TYPES.includes(businessType as any)) {
      return NextResponse.json(
        { error: `Business Type must be one of: ${BUSINESS_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate Address fields
    if (!buildingNumber?.trim()) {
      return NextResponse.json({ error: 'Flat / Shop / Building number is required' }, { status: 400 });
    }
    if (!streetArea?.trim()) {
      return NextResponse.json({ error: 'Street / Area is required' }, { status: 400 });
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }
    if (!state?.trim()) {
      return NextResponse.json({ error: 'State is required' }, { status: 400 });
    }
    if (!pinCode?.trim() || !/^\d{6}$/.test(pinCode.trim())) {
      return NextResponse.json({ error: 'A valid 6-digit PIN code is required' }, { status: 400 });
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { error: 'You must agree to the Terms and Conditions and Privacy Policy to register' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Prevent Duplicate Registration
    // Check pending/active registrations with matching email or primary phone
    const existingRegistration = await prisma.storeRegistration.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { primaryPhone: cleanedPrimaryPhone },
        ],
        status: {
          not: 'REJECTED',
        },
      },
    });

    if (existingRegistration) {
      const field = existingRegistration.email === normalizedEmail ? 'email address' : 'primary phone number';
      return NextResponse.json(
        {
          error: `An active or pending registration already exists with this ${field}. Please check your application status.`,
          applicationId: existingRegistration.applicationId,
        },
        { status: 409 }
      );
    }

    // Also check existing User accounts
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: cleanedPrimaryPhone },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'email address' : 'phone number';
      return NextResponse.json(
        {
          error: `An account with this ${field} is already registered on our platform. Please log in or use another ${field}.`,
        },
        { status: 409 }
      );
    }

    // 3. Assemble Full Address
    const fullAddress = `${buildingNumber.trim()}, ${streetArea.trim()}, ${city.trim()}, ${state.trim()} - ${pinCode.trim()}, ${country.trim()}`;

    // 4. Generate unique application ID
    let applicationId = generateApplicationId();
    let collisionCheck = await prisma.storeRegistration.findUnique({ where: { applicationId } });
    while (collisionCheck) {
      applicationId = generateApplicationId();
      collisionCheck = await prisma.storeRegistration.findUnique({ where: { applicationId } });
    }

    // 5. Store Registration Record (No login account created yet)
    const registration = await prisma.storeRegistration.create({
      data: {
        applicationId,
        ownerName: ownerName.trim(),
        storeName: storeName.trim(),
        primaryPhone: cleanedPrimaryPhone,
        additionalPhones: validAdditionalPhones,
        gstNumber: gstNumber ? gstNumber.trim().toUpperCase() : null,
        email: normalizedEmail,
        businessType: businessType.trim(),
        businessDescription: businessDescription?.trim() || null,
        buildingNumber: buildingNumber.trim(),
        streetArea: streetArea.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        country: country.trim() || 'India',
        fullAddress,
        status: 'PENDING',
      },
    });

    // 6. Audit Trail
    await prisma.auditLog.create({
      data: {
        action: 'REGISTRATION_SUBMITTED',
        entityType: 'StoreRegistration',
        entityId: registration.id,
        actorEmail: normalizedEmail,
        actorRole: 'APPLICANT',
        details: {
          applicationId,
          storeName: registration.storeName,
          ownerName: registration.ownerName,
        },
      },
    });

    // 7. Dispatch Confirmation Email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const trackingUrl = `${appUrl.replace(/\/$/, '')}/register/track?appId=${encodeURIComponent(applicationId)}&id=${encodeURIComponent(normalizedEmail)}`;

    await sendRegistrationSubmittedEmail({
      email: normalizedEmail,
      ownerName: registration.ownerName,
      storeName: registration.storeName,
      applicationId: registration.applicationId,
      trackingUrl,
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: registration.applicationId,
        message:
          'Your store registration has been submitted successfully. Our administration team will review your business details. Once approved, your login credentials will be shared with your registered email address.',
        registration: {
          applicationId: registration.applicationId,
          storeName: registration.storeName,
          ownerName: registration.ownerName,
          email: registration.email,
          status: registration.status,
          submittedAt: registration.submittedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Store registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during registration. Please try again later.' },
      { status: 500 }
    );
  }
}

