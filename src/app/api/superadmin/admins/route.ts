import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, generateTemporaryPassword } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized Superadmin access' }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      include: {
        stores: {
          include: {
            _count: {
              select: { products: true, orders: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Fetch admins error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized Superadmin access' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, storeName, phone, address, customPassword } = body;

    if (!name || !email || !storeName || !phone) {
      return NextResponse.json(
        { error: 'Name, Email, Store Name, and Phone are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(storeName);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.store.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Temporary password generation
    const temporaryPassword = customPassword && customPassword.trim() !== ''
      ? customPassword.trim()
      : generateTemporaryPassword(10);

    const passwordHash = await hashPassword(temporaryPassword);

    // Create user and associated store in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          firstLogin: true, // Forces first-time password reset
        },
      });

      const newStore = await tx.store.create({
        data: {
          adminId: newUser.id,
          name: storeName.trim(),
          slug: finalSlug,
          phone: phone.trim(),
          address: address?.trim() || null,
          status: 'ACTIVE',
        },
      });

      return { newUser, newStore };
    });

    return NextResponse.json({
      success: true,
      message: 'Admin and store created successfully',
      admin: {
        id: result.newUser.id,
        name: result.newUser.name,
        email: result.newUser.email,
        temporaryPassword, // returned once for Superadmin to copy and share!
        store: result.newStore,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating admin' },
      { status: 500 }
    );
  }
}
