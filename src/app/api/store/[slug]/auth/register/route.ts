import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

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
        { error: 'Cannot register on a suspended store' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, phone, password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Require either phone or email
    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Please provide either a phone number or email address' },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? phone.trim() : null;
    const cleanEmail = email
      ? email.toLowerCase().trim()
      : `${cleanPhone?.replace(/\D/g, '') || Date.now()}@customer.${store.slug}.internal`;

    // Check if email or phone already registered
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email or phone number already exists. Please log in.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Lock customer data to database under role CUSTOMER and link to this store
    const customer = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        firstLogin: false,
        registeredStoreId: store.id,
      },
    });

    // Check if there are past orders placed under this customer's phone number at this store and link them
    if (cleanPhone) {
      await prisma.order.updateMany({
        where: {
          storeId: store.id,
          customerPhone: cleanPhone,
          customerId: null,
        },
        data: {
          customerId: customer.id,
        },
      });
    }

    const token = signToken({
      userId: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone || undefined,
      role: 'CUSTOMER',
      firstLogin: false,
      storeId: store.id,
      storeSlug: store.slug,
    });

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        role: customer.role,
        storeSlug: store.slug,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
