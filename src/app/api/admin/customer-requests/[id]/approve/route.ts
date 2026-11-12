import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import {
  generateCompliantTemporaryPassword,
  validatePasswordStrength,
} from '@/lib/registrationValidators';
import { sendCustomerApprovedEmail } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';

async function getAdminStore(adminUserId: string, fallbackStoreId?: string) {
  if (fallbackStoreId) {
    return prisma.store.findUnique({
      where: { id: fallbackStoreId },
      select: { id: true, name: true, slug: true },
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: adminUserId },
    include: { stores: { take: 1, select: { id: true, name: true, slug: true } } },
  });
  return user?.stores[0] || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentStore = await getAdminStore(adminUser.userId, adminUser.storeId);
    if (!currentStore) {
      return NextResponse.json({ error: 'No associated store found for this admin' }, { status: 404 });
    }

    const { id } = params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is permitted for default auto-generation
    }

    const { passwordOption = 'auto', customPassword, customLoginId } = body;

    // 1. Fetch current request state
    const request = await prisma.customerRegistrationRequest.findUnique({
      where: { id },
      include: { store: true, createdCustomer: true },
    });

    if (!request) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }

    // 2. Tenant isolation verification
    if (request.storeId !== currentStore.id && adminUser.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Tenant isolation violation: you do not have permission to approve this customer request.' },
        { status: 403 }
      );
    }

    // 3. Prevent duplicate approval
    if (request.status === 'APPROVED' || request.createdCustomerId) {
      return NextResponse.json(
        {
          error: 'This registration has already been approved. Duplicate account creation prevented.',
          customer: request.createdCustomer,
        },
        { status: 409 }
      );
    }

    // 4. Temporary Password Resolution
    let temporaryPassword = '';
    if (passwordOption === 'manual') {
      if (!customPassword) {
        return NextResponse.json({ error: 'Custom temporary password is required' }, { status: 400 });
      }
      const strength = validatePasswordStrength(customPassword);
      if (!strength.valid) {
        return NextResponse.json(
          { error: `Password strength criteria not met: ${strength.errors.join(', ')}` },
          { status: 400 }
        );
      }
      temporaryPassword = customPassword;
    } else {
      temporaryPassword = generateCompliantTemporaryPassword(10);
    }

    // 5. Generate or assign unique Login ID
    let loginId = customLoginId?.trim() || `cust_${request.phone}`;
    let loginExists = await prisma.user.findFirst({
      where: {
        OR: [{ loginId }, { email: loginId }],
      },
    });
    if (loginExists) {
      loginId = `${loginId}_${crypto.randomBytes(2).toString('hex')}`;
    }

    const passwordHash = await hashPassword(temporaryPassword);

    // 6. Check if email is already taken by a User
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: request.email },
    });

    // 7. Atomic Provisioning
    const result = await prisma.$transaction(async (tx) => {
      let customerUser: any;

      if (existingUserByEmail) {
        // If user already belongs to this store as customer, update credentials
        if (existingUserByEmail.registeredStoreId === currentStore.id) {
          customerUser = await tx.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              name: request.fullName,
              phone: request.phone,
              loginId,
              passwordHash,
              status: 'ACTIVE',
              firstLogin: true,
              mustChangePassword: true,
            },
          });
        } else {
          throw new Error(
            `A user account with email "${request.email}" already exists under a different tenant. Customer accounts must have a unique email.`
          );
        }
      } else {
        // Create new Customer User
        customerUser = await tx.user.create({
          data: {
            name: request.fullName,
            email: request.email,
            phone: request.phone,
            loginId,
            passwordHash,
            role: 'CUSTOMER',
            status: 'ACTIVE',
            firstLogin: true,
            mustChangePassword: true,
            registeredStoreId: currentStore.id,
          },
        });
      }

      // Link any past guest orders matching this phone number for this store
      await tx.order.updateMany({
        where: {
          storeId: currentStore.id,
          customerPhone: request.phone,
          customerId: null,
        },
        data: {
          customerId: customerUser.id,
        },
      });

      // Update registration status
      const updatedRequest = await tx.customerRegistrationRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: adminUser.name || adminUser.email,
          createdCustomerId: customerUser.id,
        },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          action: 'CUSTOMER_REGISTRATION_APPROVED',
          entityType: 'CustomerRegistrationRequest',
          entityId: request.id,
          actorId: adminUser.userId,
          actorEmail: adminUser.email,
          actorRole: adminUser.role,
          details: {
            storeId: currentStore.id,
            storeName: currentStore.name,
            customerId: customerUser.id,
            customerName: customerUser.name,
            customerEmail: customerUser.email,
            loginId,
            passwordOption,
          },
        },
      });

      return { customerUser, updatedRequest };
    });

    // 8. Dispatch Credentials Email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const storeLoginUrl = `${appUrl.replace(/\/$/, '')}/store/${currentStore.slug}/login`;

    let emailSent = false;
    let emailError: string | undefined;

    try {
      const emailResult = await sendCustomerApprovedEmail({
        email: request.email,
        customerName: request.fullName,
        storeName: currentStore.name,
        loginId,
        temporaryPassword,
        loginUrl: storeLoginUrl,
      });
      emailSent = emailResult.success;
      emailError = emailResult.error;
    } catch (e: any) {
      console.warn('Customer approval email dispatch error:', e.message);
      emailError = e.message;
    }

    return NextResponse.json({
      success: true,
      message: 'Customer registration approved and account created successfully.',
      customer: {
        id: result.customerUser.id,
        name: result.customerUser.name,
        email: result.customerUser.email,
        phone: result.customerUser.phone,
        loginId,
        temporaryPassword,
        storeLoginUrl,
      },
      emailDelivery: {
        sent: emailSent,
        error: emailError,
      },
    });
  } catch (error: any) {
    console.error('Approve customer request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve customer request' },
      { status: 500 }
    );
  }
}

