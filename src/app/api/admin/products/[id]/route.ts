import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getEffectiveProductFields } from '@/lib/productFields';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const store = await prisma.store.findFirst({
      where: { adminId: user.userId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
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

    const existingProduct = await prisma.product.findFirst({ where: { id, storeId: store.id } });
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const dataToUpdate: any = {};
    const configuredFields = await getEffectiveProductFields(store.id, categoryId === undefined ? existingProduct.categoryId : categoryId);
    const nextValues: Record<string, unknown> = {
      title: title === undefined ? existingProduct.title : title,
      sku: sku === undefined ? existingProduct.sku : sku,
      brand: brand === undefined ? existingProduct.brand : brand,
      description: description === undefined ? existingProduct.description : description,
      price: price === undefined ? existingProduct.price : price,
      discountPrice: discountPrice === undefined ? existingProduct.discountPrice : discountPrice,
      stock: stock === undefined ? existingProduct.stock : stock,
      images: images === undefined ? existingProduct.images : images,
      variants: variants === undefined ? existingProduct.variants : variants,
      specifications: specifications === undefined ? existingProduct.specifications : specifications,
      ...(existingProduct.attributes as Record<string, unknown> || {}),
      ...(attributes && typeof attributes === 'object' ? attributes : {}),
    };
    const missingField = configuredFields.filter((field) => field.required).find((field) => {
      const value = nextValues[field.key];
      return value === undefined || value === null || value === '' ||
        (Array.isArray(value) && value.length === 0);
    });
    if (missingField) return NextResponse.json({ error: `${missingField.label} is required` }, { status: 400 });
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (sku !== undefined) dataToUpdate.sku = sku?.trim() || null;
    if (brand !== undefined) dataToUpdate.brand = brand?.trim() || null;
    if (description !== undefined) dataToUpdate.description = description?.trim() || null;
    if (price !== undefined) dataToUpdate.price = price === null || price === '' ? null : parseFloat(price);
    if (discountPrice !== undefined) {
      dataToUpdate.discountPrice = discountPrice === null || discountPrice === '' ? null : parseFloat(discountPrice);
    }
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock, 10);
    if (images !== undefined) {
      dataToUpdate.images = Array.isArray(images)
        ? images.map((i: string) => i.trim()).filter(Boolean)
        : [];
    }
    if (categoryId !== undefined) dataToUpdate.categoryId = categoryId || null;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (variants !== undefined) dataToUpdate.variants = variants;
    if (specifications !== undefined) dataToUpdate.specifications = specifications;
    if (attributes !== undefined) dataToUpdate.attributes = attributes;

    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: dataToUpdate,
      include: { category: true },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const store = await prisma.store.findFirst({
      where: { adminId: user.userId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const existingProduct = await prisma.product.findFirst({ where: { id, storeId: store.id } });
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    await prisma.product.delete({ where: { id: existingProduct.id } });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
