import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

async function getAdminStore() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return null;
  return prisma.store.findFirst({ where: { adminId: user.userId } });
}

export async function GET() {
  try {
    const store = await getAdminStore();
    if (!store) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const [fields, categories, products] = await Promise.all([
      prisma.productFieldDefinition.findMany({
        where: { storeId: store.id },
        include: { category: { select: { id: true, name: true } }, product: { select: { id: true, title: true } } },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.category.findMany({ where: { storeId: store.id }, orderBy: { name: 'asc' } }),
      prisma.product.findMany({ where: { storeId: store.id }, select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    ]);
    return NextResponse.json({ fields, categories, products });
  } catch (error) {
    console.error('Product field list error:', error);
    return NextResponse.json({ error: 'Failed to load product fields' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const store = await getAdminStore();
    if (!store) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const body = await req.json();
    const label = String(body.label || '').trim();
    const key = String(body.key || label).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!key || !label) return NextResponse.json({ error: 'Field name and label are required' }, { status: 400 });
    const field = await prisma.productFieldDefinition.create({
      data: {
        storeId: store.id,
        key,
        label,
        type: body.type || 'text',
        options: body.options || null,
        required: Boolean(body.required),
        customerVisibility: body.customerVisibility || 'VISIBLE',
        categoryId: body.categoryId || null,
        productId: body.productId || null,
        displayOrder: Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 100,
      },
    });
    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error('Product field create error:', error);
    return NextResponse.json({ error: 'Failed to create product field' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const store = await getAdminStore();
    if (!store) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'Field id is required' }, { status: 400 });
    const existing = await prisma.productFieldDefinition.findFirst({ where: { id: body.id, storeId: store.id } });
    if (!existing) return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    const field = await prisma.productFieldDefinition.update({
      where: { id: existing.id },
      data: {
        key: body.key === undefined ? undefined : String(body.key).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label: body.label === undefined ? undefined : String(body.label).trim(),
        type: body.type,
        options: body.options,
        required: body.required === undefined ? undefined : Boolean(body.required),
        customerVisibility: body.customerVisibility,
        categoryId: body.categoryId === undefined ? undefined : body.categoryId || null,
        productId: body.productId === undefined ? undefined : body.productId || null,
        displayOrder: body.displayOrder === undefined ? undefined : Number(body.displayOrder),
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
      },
    });
    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error('Product field update error:', error);
    return NextResponse.json({ error: 'Failed to update product field' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const store = await getAdminStore();
    if (!store) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const id = new URL(req.url).searchParams.get('id');
    const deleteValues = new URL(req.url).searchParams.get('deleteValues') === 'true';
    const existing = id ? await prisma.productFieldDefinition.findFirst({ where: { id, storeId: store.id } }) : null;
    if (!existing) return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    if (deleteValues) {
      const products = await prisma.product.findMany({ where: { storeId: store.id, ...(existing.categoryId ? { categoryId: existing.categoryId } : {}), ...(existing.productId ? { id: existing.productId } : {}) }, select: { id: true, attributes: true } });
      await prisma.$transaction(products.map((product) => {
        const attributes = { ...(product.attributes as Record<string, unknown> || {}) };
        delete attributes[existing.key];
        return prisma.product.update({ where: { id: product.id }, data: { attributes: attributes as Prisma.InputJsonValue } });
      }));
    }
    await prisma.productFieldDefinition.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product field delete error:', error);
    return NextResponse.json({ error: 'Failed to remove product field' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
    try {
      const store = await getAdminStore();
      if (!store) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      const body = await req.json();
      if (body.fieldId) {
        const field = await prisma.productFieldDefinition.findFirst({ where: { id: body.fieldId, storeId: store.id } });
        if (!field) return NextResponse.json({ error: 'Field not found' }, { status: 404 });
        const updated = await prisma.productFieldDefinition.update({
          where: { id: field.id },
          data: {
            customerVisibility: body.customerVisibility,
            required: body.required,
            label: body.label,
          },
        });
        return NextResponse.json({ success: true, field: updated });
      }
      const productIds = Array.isArray(body.productIds) ? body.productIds.filter(Boolean) : [];
      const key = String(body.key || '').trim();
      if (!productIds.length || !key) return NextResponse.json({ error: 'Product ids and field key are required' }, { status: 400 });
      const products = await prisma.product.findMany({ where: { storeId: store.id, id: { in: productIds } }, select: { id: true, attributes: true } });
      await prisma.$transaction(products.map((product) => {
        const attributes = { ...(product.attributes as Record<string, unknown> || {}) };
        if (body.remove) delete attributes[key];
        else attributes[key] = body.value;
        return prisma.product.update({ where: { id: product.id }, data: { attributes: attributes as Prisma.InputJsonValue } });
      }));
      return NextResponse.json({ success: true, updated: products.length });
    } catch (error) {
      console.error('Bulk product field update error:', error);
      return NextResponse.json({ error: 'Failed to update product fields' }, { status: 500 });
  }
}
