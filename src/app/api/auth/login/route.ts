import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; password?: string };
    try {
      body = JSON.parse(await req.text());
    } catch {
      return NextResponse.json(
        { error: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const rawIdentifier = email.trim();
    const normalizedEmail = rawIdentifier.toLowerCase() === 'superadmin'
      ? 'superadmin@platform.com'
      : rawIdentifier.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: rawIdentifier },
          { loginId: rawIdentifier },
          { phone: rawIdentifier },
        ],
      },
      include: {
        stores: {
          take: 1,
          select: { id: true, name: true, slug: true, status: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email, username, or password' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your account has been deactivated or suspended. Please contact platform administration.' },
        { status: 403 }
      );
    }

    const primaryStore = user.stores[0];
    if (user.role === 'ADMIN' && primaryStore && primaryStore.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your store account has been suspended by administration. Please contact compliance.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid email, username, or password' },
        { status: 401 }
      );
    }

    const mustChange = Boolean(user.firstLogin || user.mustChangePassword);

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      firstLogin: mustChange,
      storeId: primaryStore?.id,
      storeSlug: primaryStore?.slug,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        loginId: user.loginId,
        role: user.role,
        firstLogin: mustChange,
        mustChangePassword: mustChange,
        store: primaryStore,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
