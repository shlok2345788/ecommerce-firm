import prisma from '@/lib/prisma';

export type CustomerVisibility = 'VISIBLE' | 'HIDDEN' | 'ADMIN_ONLY';

export const DEFAULT_PRODUCT_FIELDS = [
  { key: 'title', label: 'Product name', type: 'text', required: true, customerVisibility: 'VISIBLE' },
  { key: 'description', label: 'Description', type: 'text', required: false, customerVisibility: 'VISIBLE' },
  { key: 'brand', label: 'Brand', type: 'text', required: false, customerVisibility: 'VISIBLE' },
  { key: 'sku', label: 'SKU', type: 'text', required: false, customerVisibility: 'ADMIN_ONLY' },
  { key: 'price', label: 'Price', type: 'number', required: false, customerVisibility: 'VISIBLE' },
  { key: 'discountPrice', label: 'Sale price', type: 'number', required: false, customerVisibility: 'VISIBLE' },
  { key: 'stock', label: 'Stock', type: 'number', required: false, customerVisibility: 'ADMIN_ONLY' },
  { key: 'images', label: 'Images', type: 'image', required: false, customerVisibility: 'VISIBLE' },
  { key: 'variants', label: 'Variants', type: 'object', required: false, customerVisibility: 'VISIBLE' },
  { key: 'specifications', label: 'Specifications', type: 'object', required: false, customerVisibility: 'VISIBLE' },
];

export async function ensureDefaultProductFields(storeId: string) {
  const existing = await prisma.productFieldDefinition.findMany({
    where: { storeId, categoryId: null, productId: null },
    select: { key: true },
  });
  const keys = new Set(existing.map((field) => field.key));
  const missing = DEFAULT_PRODUCT_FIELDS.filter((field) => !keys.has(field.key));
  if (missing.length) {
    await prisma.productFieldDefinition.createMany({
      data: missing.map((field, index) => ({
        storeId,
        ...field,
        displayOrder: index,
      })),
    });
  }
}

export async function getEffectiveProductFields(storeId: string, categoryId?: string | null, productId?: string) {
  await ensureDefaultProductFields(storeId);
  const definitions = await prisma.productFieldDefinition.findMany({
    where: {
      storeId,
      isActive: true,
      OR: [
        { categoryId: null, productId: null },
        ...(categoryId ? [{ categoryId, productId: null }] : []),
        ...(productId ? [{ productId }] : []),
      ],
    },
    orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const byKey = new Map<string, typeof definitions[number]>();
  for (const definition of definitions) byKey.set(definition.key, definition);
  return Array.from(byKey.values()).sort((a, b) => a.displayOrder - b.displayOrder);
}

function builtInValue(product: Record<string, any>, key: string) {
  if (key === 'category') return product.category?.name;
  return product[key];
}

export function serializeFieldValue(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return value;
  return value;
}

export async function sanitizeProductForCustomer(product: Record<string, any>) {
  const fields = await getEffectiveProductFields(product.storeId, product.categoryId, product.id);
  const visibleFields = fields
    .filter((field) => field.customerVisibility === 'VISIBLE')
    .map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      value: serializeFieldValue(builtInValue(product, field.key) ?? product.attributes?.[field.key]),
    }))
    .filter((field) => field.value !== null);
  const visibleKeys = new Set(visibleFields.map((field) => field.key));
  const canPurchase = visibleKeys.has('price') && product.price !== null && product.price !== undefined;

  return {
    id: product.id,
    storeId: product.storeId,
    categoryId: product.categoryId,
    category: product.category,
    images: visibleKeys.has('images') ? product.images : [],
    title: visibleKeys.has('title') ? product.title : '',
    price: canPurchase ? Number(product.price) : null,
    discountPrice: canPurchase && product.discountPrice !== null ? Number(product.discountPrice) : null,
    stock: visibleKeys.has('stock') ? product.stock : 0,
    publicFields: visibleFields.filter((field) => !['title', 'price', 'discountPrice', 'images', 'stock'].includes(field.key)),
    purchaseAvailable: canPurchase,
  };
}

export async function sanitizeProductsForCustomer(products: Record<string, any>[]) {
  return Promise.all(products.map((product) => sanitizeProductForCustomer(product)));
}
