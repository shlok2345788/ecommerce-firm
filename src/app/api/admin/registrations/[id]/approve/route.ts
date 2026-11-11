import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import {
  generateCompliantTemporaryPassword,
  validatePasswordStrength,
} from '@/lib/registrationValidators';
import { sendRegistrationApprovedEmail } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') || 'store';
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== 'SUPERADMIN' && adminUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is allowed if using default auto-generation
    }

    const { passwordOption = 'auto', customPassword, customLoginId } = body;

    // 1. Fetch current registration state
    const registration = await prisma.storeRegistration.findUnique({
      where: { id },
      include: { createdStore: true, storeAccount: true },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // 2. Prevent Double-Click / Duplicate Approval
    if (registration.status === 'APPROVED' || registration.createdStoreId || registration.storeAccount) {
      return NextResponse.json(
        {
          error: 'This registration has already been approved and provisioned. Duplicate account creation prevented.',
          store: registration.createdStore,
        },
        { status: 409 }
      );
    }

    // 3. Determine Temporary Password
    let temporaryPassword = '';
    if (passwordOption === 'manual') {
      if (!customPassword) {
        return NextResponse.json({ error: 'Custom temporary password is required' }, { status: 400 });
      }
      const strength = validatePasswordStrength(customPassword);
      if (!strength.valid) {
        return NextResponse.json(
          { error: `Password does not meet strength requirements: ${strength.errors.join(', ')}` },
          { status: 400 }
        );
      }
      temporaryPassword = customPassword;
    } else {
      temporaryPassword = generateCompliantTemporaryPassword(12);
    }

    // 4. Generate Unique Store Slug
    const baseSlug = slugify(registration.storeName);
    let uniqueSlug = baseSlug;
    let slugExists = await prisma.store.findUnique({ where: { slug: uniqueSlug } });
    let counter = 1;
    while (slugExists) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}-${crypto.randomBytes(2).toString('hex')}`;
      slugExists = await prisma.store.findUnique({ where: { slug: uniqueSlug } });
    }

    // 5. Generate Unique Login ID
    let loginId = customLoginId?.trim() || `owner_${baseSlug.replace(/-/g, '_')}`;
    let loginExists = await prisma.user.findFirst({
      where: {
        OR: [{ loginId }, { email: loginId }],
      },
    });
    if (loginExists) {
      loginId = `${loginId}_${crypto.randomBytes(2).toString('hex')}`;
    }

    // 6. Check if email is already taken by a User
    const existingUser = await prisma.user.findUnique({
      where: { email: registration.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: `A user account with email "${registration.email}" already exists. Cannot approve duplicate.` },
        { status: 409 }
      );
    }

    // 7. Hash the temporary password
    const passwordHash = await hashPassword(temporaryPassword);

    // 8. Execute Database Transaction for Atomic Provisioning
    const result = await prisma.$transaction(async (tx) => {
      // Create Store Admin User
      const newUser = await tx.user.create({
        data: {
          name: registration.ownerName,
          email: registration.email,
          phone: registration.primaryPhone,
          loginId,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          firstLogin: true,
          mustChangePassword: true,
        },
      });

      // Create Store
      const newStore = await tx.store.create({
        data: {
          adminId: newUser.id,
          name: registration.storeName,
          slug: uniqueSlug,
          phone: registration.primaryPhone,
          address: registration.fullAddress,
          description: registration.businessDescription,
          status: 'ACTIVE',
        },
      });

      // Create StoreAccount Record
      const newStoreAccount = await tx.storeAccount.create({
        data: {
          storeId: newStore.id,
          registrationId: registration.id,
          userId: newUser.id,
          loginId,
          email: registration.email,
          passwordHash,
          mustChangePassword: true,
          accountStatus: 'ACTIVE',
        },
      });

      // Update Registration status to APPROVED
      const updatedRegistration = await tx.storeRegistration.update({
        where: { id: registration.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: adminUser.name || adminUser.email,
          createdStoreId: newStore.id,
          createdUserId: newUser.id,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          action: 'REGISTRATION_APPROVED',
          entityType: 'StoreRegistration',
          entityId: registration.id,
          actorId: adminUser.userId,
          actorEmail: adminUser.email,
          actorRole: adminUser.role,
          details: {
            storeId: newStore.id,
            storeName: newStore.name,
            storeSlug: newStore.slug,
            loginId,
            passwordOption,
          },
        },
      });

      return { newUser, newStore, newStoreAccount, updatedRegistration };
    });

    // 9. Dispatch Credentials Email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl.replace(/\/$/, '')}/login`;

    let emailSent = false;
    let emailError: string | undefined;

    try {
      const emailResult = await sendRegistrationApprovedEmail({
        email: registration.email,
        ownerName: registration.ownerName,
        storeName: registration.storeName,
        storeId: result.newStore.id,
        storeSlug: result.newStore.slug,
        loginId,
        temporaryPassword,
        loginUrl,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
    } catch (e: any) {
      console.warn('Email dispatch failed during approval:', e.message);
      emailError = e.message;
    }

    return NextResponse.json({
      success: true,
      message: 'Store registration successfully approved and account created.',
      store: {
        id: result.newStore.id,
        name: result.newStore.name,
        slug: result.newStore.slug,
      },
      account: {
        loginId,
        email: registration.email,
        temporaryPassword,
        mustChangePassword: true,
      },
      emailDelivery: {
        sent: emailSent,
        error: emailError,
      },
    });
  } catch (error: any) {
    console.error('Approve registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve registration' },
      { status: 500 }
    );
  }
}

