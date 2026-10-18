import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'multitenant-ecommerce-secret-key-default';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'CUSTOMER';
  name: string;
  phone?: string;
  firstLogin: boolean;
  storeId?: string;
  storeSlug?: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function generateTemporaryPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Check if user is still active in DB
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        stores: { take: 1 },
        registeredStore: { select: { id: true, slug: true } },
      },
    });

    if (!user || user.status !== 'ACTIVE') return null;

    const primaryStore = user.stores[0];
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      role: user.role as 'SUPERADMIN' | 'ADMIN' | 'CUSTOMER',
      firstLogin: user.firstLogin,
      storeId: primaryStore?.id || user.registeredStore?.id || undefined,
      storeSlug: primaryStore?.slug || user.registeredStore?.slug || undefined,
    };
  } catch (e) {
    return null;
  }
}
