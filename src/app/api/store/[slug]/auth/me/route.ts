import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, customer: null });
  }

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
}
