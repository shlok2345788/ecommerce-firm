import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const store = await prisma.store.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                products: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (store.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          error: 'This store is temporarily unavailable due to administrative review.',
          isSuspended: true,
          storeName: store.name,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort') || 'newest';

    const productWhere: any = {
      storeId: store.id,
      isActive: true,
    };

    if (categorySlug && categorySlug !== 'all') {
      productWhere.category = { slug: categorySlug };
    }

    if (search) {
      productWhere.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'price-asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price-desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'title-asc') {
      orderBy = { title: 'asc' };
    } else if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const products = await prisma.product.findMany({
      where: productWhere,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        logoUrl: store.logoUrl,
        description: store.description,
        phone: store.phone,
        address: store.address,
        status: store.status,
      },
      categories: store.categories,
      products,
    });
  } catch (error) {
    console.error('Fetch store front error:', error);
    return NextResponse.json({ error: 'Failed to retrieve store front' }, { status: 500 });
  }
}
