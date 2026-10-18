import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Retrieve full user record with passwordHash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { stores: { take: 1 } },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If currentPassword is provided, verify it
    if (currentPassword) {
      const isMatch = await comparePassword(currentPassword, dbUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Current password does not match' },
          { status: 400 }
        );
      }
    }

    const newHash = await hashPassword(newPassword);

    // Update user record: set new password hash and clear firstLogin flag!
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: {
        passwordHash: newHash,
        firstLogin: false,
      },
    });

    // Re-issue token with firstLogin: false
    const primaryStore = dbUser.stores[0];
    const newToken = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      firstLogin: false,
      storeId: primaryStore?.id,
      storeSlug: primaryStore?.slug,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Password successfully updated',
      firstLogin: false,
    });

    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
