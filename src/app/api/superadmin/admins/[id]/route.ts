import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, generateTemporaryPassword } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized Superadmin access' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, resetPassword } = body;

    const dataToUpdate: any = {};

    if (status && ['ACTIVE', 'INACTIVE'].includes(status)) {
      dataToUpdate.status = status;
    }

    let generatedPassword: string | null = null;
    if (resetPassword) {
      generatedPassword = generateTemporaryPassword(10);
      dataToUpdate.passwordHash = await hashPassword(generatedPassword);
      dataToUpdate.firstLogin = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: { stores: true },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      newTemporaryPassword: generatedPassword,
    });
  } catch (error) {
    console.error('Update admin error:', error);
    return NextResponse.json({ error: 'Failed to update admin account' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized Superadmin access' }, { status: 403 });
    }

    const { id } = params;

    // Prevent deleting self
    if (currentUser.userId === id) {
      return NextResponse.json({ error: 'Cannot delete current logged-in Superadmin' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}
