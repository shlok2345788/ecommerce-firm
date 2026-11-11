import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, comparePassword, signToken } from '@/lib/auth';
import { validatePasswordStrength } from '@/lib/registrationValidators';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

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
          error: `Password does not meet security requirements: ${strength.errors.join(', ')}`,
          rules: strength.rules,
        },
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

    // Verify current password
    if (currentPassword) {
      const isMatch = await comparePassword(currentPassword, dbUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Current / temporary password is incorrect' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Current password is required to authorize password change' },
        { status: 400 }
      );
    }

    // Prevent re-using the same password
    const isSamePassword = await comparePassword(newPassword, dbUser.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from your temporary password' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    // Update user record: set new password hash and clear firstLogin & mustChangePassword
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.userId },
        data: {
          passwordHash: newHash,
          firstLogin: false,
          mustChangePassword: false,
        },
      }),
      prisma.storeAccount.updateMany({
        where: { userId: user.userId },
        data: {
          passwordHash: newHash,
          mustChangePassword: false,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'PASSWORD_CHANGED',
          entityType: 'User',
          entityId: user.userId,
          actorId: user.userId,
          actorEmail: user.email,
          actorRole: user.role,
        },
      }),
    ]);

    // Re-issue fresh token with firstLogin: false
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
      message: 'Password successfully updated. Store console access unlocked.',
      firstLogin: false,
      mustChangePassword: false,
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

