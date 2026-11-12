import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import {
  validateIndianPhone,
  cleanIndianPhone,
  validateEmail,
  validateGSTIN,
} from '@/lib/registrationValidators';
import { sendCustomerRegistrationSubmittedEmail } from '@/lib/email';

export const runtime = 'nodejs';

function generateApplicationId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CUST-${dateStr}-${randomHex}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const store = await prisma.store.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, status: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'This store is temporarily suspended and cannot accept registrations.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      name,
      phone,
      additionalPhone,
      email,
      address,
      pinCode,
      gstNumber,
    } = body;

    const customerName = (fullName || name || '').trim();
    if (!customerName || customerName.length < 2) {
      return NextResponse.json(
        { error: 'Full Name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!phone || !validateIndianPhone(phone)) {
      return NextResponse.json(
        { error: 'Valid 10-digit primary phone number is required' },
        { status: 400 }
      );
    }

    const cleanedPhone = cleanIndianPhone(phone);

    if (additionalPhone && additionalPhone.trim()) {
      if (!validateIndianPhone(additionalPhone)) {
        return NextResponse.json(
          { error: 'Additional phone number must be a valid 10-digit number' },
          { status: 400 }
        );
      }
    }

    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const cleanedEmail = email.toLowerCase().trim();

    if (!address || address.trim().length < 5) {
      return NextResponse.json(
        { error: 'Complete delivery/business address is required' },
        { status: 400 }
      );
    }

    if (!pinCode || pinCode.trim().length < 4) {
      return NextResponse.json(
        { error: 'Valid postal PIN Code is required' },
        { status: 400 }
      );
    }

    if (!gstNumber || !validateGSTIN(gstNumber)) {
      return NextResponse.json(
        { error: 'Valid 15-character GSTIN is mandatory (e.g. 27ABCDE1234F1Z5)' },
        { status: 400 }
      );
    }

    const cleanedGSTIN = gstNumber.trim().toUpperCase();

    // 1. Check if user is already an active customer of THIS store
    const existingActiveCustomer = await prisma.user.findFirst({
      where: {
        registeredStoreId: store.id,
        role: 'CUSTOMER',
        OR: [
          { email: cleanedEmail },
          { phone: cleanedPhone },
        ],
      },
    });

    if (existingActiveCustomer) {
      return NextResponse.json(
        {
          error: `An active customer account with this email or phone is already registered with ${store.name}. Please sign in.`,
        },
        { status: 409 }
      );
    }

    // 2. Check if a pending registration already exists for this store
    const existingRequest = await prisma.customerRegistrationRequest.findFirst({
      where: {
        storeId: store.id,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'ADDITIONAL_INFO_REQUIRED'] },
        OR: [
          { email: cleanedEmail },
          { phone: cleanedPhone },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: `A registration request for this store is already under review. Application Reference: ${existingRequest.applicationId}`,
          applicationId: existingRequest.applicationId,
          status: existingRequest.status,
        },
        { status: 409 }
      );
    }

    // 3. Generate unique application ID
    let applicationId = generateApplicationId();
    while (await prisma.customerRegistrationRequest.findUnique({ where: { applicationId } })) {
      applicationId = generateApplicationId();
    }

    // 4. Create customer registration request
    const request = await prisma.customerRegistrationRequest.create({
      data: {
        applicationId,
        storeId: store.id,
        fullName: customerName,
        phone: cleanedPhone,
        additionalPhone: additionalPhone?.trim() || null,
        email: cleanedEmail,
        address: address.trim(),
        pinCode: pinCode.trim(),
        gstNumber: cleanedGSTIN,
        status: 'PENDING',
      },
    });

    // 5. Dispatch confirmation email (non-blocking)
    try {
      await sendCustomerRegistrationSubmittedEmail({
        email: cleanedEmail,
        customerName,
        storeName: store.name,
        applicationId,
      });
    } catch (e: any) {
      console.warn('Confirmation email dispatch warning:', e.message);
    }

    return NextResponse.json({
      success: true,
      applicationId,
      message:
        'Your registration has been submitted successfully. The store administrator will verify your details and share your login credentials once approved.',
      store: {
        name: store.name,
        slug: store.slug,
      },
    });
  } catch (error: any) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while submitting registration' },
      { status: 500 }
    );
  }
}
