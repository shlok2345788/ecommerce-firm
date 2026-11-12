import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, comparePassword, hashPassword, signToken } from '@/lib/auth';
import { validatePasswordStrength } from '@/lib/registrationValidators';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const store = await prisma.store.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user belongs to this store
    if (currentUser.role !== 'CUSTOMER' || currentUser.storeId !== store.id) {
      return NextResponse.json({ error: 'Access denied to this store' }, { status: 403 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current / temporary password is required' },
        { status: 400 }
      );
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json(
        {
          error: `Password requirements not met: ${strength.errors.join(', ')}`,
          rules: strength.rules,
        },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current temporary password
    const isCurrentValid = await comparePassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Current / temporary password is incorrect' },
        { status: 400 }
      );
    }

    // Verify new password is not identical to current
    const isSame = await comparePassword(newPassword, dbUser.passwordHash);
    if (isSame) {
      return NextResponse.json(
        { error: 'New password must be different from temporary password' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        passwordHash: newHash,
        firstLogin: false,
        mustChangePassword: false,
      },
    });

    // Sign new token with firstLogin: false
    const token = signToken({
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone || undefined,
      role: dbUser.role as 'SUPERADMIN' | 'ADMIN' | 'CUSTOMER',
      firstLogin: false,
      storeId: store.id,
      storeSlug: store.slug,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password successfully updated. Customer dashboard unlocked.',
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Customer change-password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update password' },
      { status: 500 }
    );
  }
}
