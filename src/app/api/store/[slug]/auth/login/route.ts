import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

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

    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Phone/Email and password are required' },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();
    const normalizedEmail = trimmed.toLowerCase();

    // Find customer by email or phone
    const customer = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { phone: trimmed },
          { phone: trimmed.replace(/\s+/g, '') },
        ],
      },
      include: {
        registeredStore: { select: { id: true, slug: true } },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password' },
        { status: 401 }
      );
    }

    if (customer.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, customer.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid phone/email or password' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone || undefined,
      role: customer.role as 'SUPERADMIN' | 'ADMIN' | 'CUSTOMER',
      firstLogin: customer.firstLogin,
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
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    );
  }
}
