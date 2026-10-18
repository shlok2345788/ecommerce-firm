import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized Admin access' }, { status: 403 });
    }

    const store = await prisma.store.findFirst({
      where: { adminId: user.userId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const categories = await prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized Admin access' }, { status: 403 });
    }

    const store = await prisma.store.findFirst({
      where: { adminId: user.userId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, slug } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const cleanSlug = slugify(slug && slug.trim() !== '' ? slug : name);

    // Verify unique within store
    const existing = await prisma.category.findUnique({
      where: {
        storeId_slug: {
          storeId: store.id,
          slug: cleanSlug,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Category with slug "${cleanSlug}" already exists in your store` },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        storeId: store.id,
        name: name.trim(),
        slug: cleanSlug,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
