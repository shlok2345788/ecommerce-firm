import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');

    const whereClause: any = {
      storeId: store.id,
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    const {
      title,
      sku,
      brand,
      description,
      price,
      discountPrice,
      stock,
      images,
      variants,
      specifications,
      attributes,
      categoryId,
      isActive,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Product title is required' },
        { status: 400 }
      );
    }
    if (price !== undefined && price !== null && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      return NextResponse.json({ error: 'Price must be empty or a non-negative number' }, { status: 400 });
    }

    // Process images (filter out blanks)
    const imagesArray = Array.isArray(images)
      ? images.map((img: string) => img.trim()).filter((img: string) => img.length > 0)
      : [];

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        categoryId: categoryId || null,
        title: title.trim(),
        sku: sku?.trim() || null,
        brand: brand?.trim() || null,
        description: description?.trim() || null,
        price: price === undefined || price === null || price === '' ? null : parseFloat(price),
        discountPrice: discountPrice && parseFloat(discountPrice) > 0 ? parseFloat(discountPrice) : null,
        stock: parseInt(stock, 10) || 0,
        images: imagesArray.length > 0 ? imagesArray : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
        variants: variants ?? null,
        specifications: specifications ?? null,
        attributes: attributes ?? null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
