import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { uploadImage } from '@/lib/imageStorage';
import { slugify } from '@/lib/utils';
import { getEffectiveProductFields } from '@/lib/productFields';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ImportRow = {
  rowNumber: number;
  title: string;
  sku: string;
  brand: string;
  description: string;
  price: number | null;
  discountPrice: number | null;
  category: string;
  stock: number;
  variants: Record<string, string>;
  specifications: Record<string, string>;
  attributes: Record<string, string>;
  images: string[];
  imageNames: string[];
  errors: string[];
  warnings: string[];
  status: 'READY' | 'MISSING_IMAGE' | 'INVALID';
};

type UploadedImage = { name: string; url: string };

const aliases: Record<string, string[]> = {
  title: ['title', 'name', 'product', 'productname', 'producttitle'],
  sku: ['sku', 'code', 'productcode', 'itemcode'],
  brand: ['brand', 'manufacturer'],
  description: ['description', 'details', 'productdescription'],
  price: ['price', 'mrp', 'regularprice', 'sellingprice'],
  discountPrice: ['saleprice', 'discountprice', 'offerprice', 'discountedprice'],
  category: ['category', 'categoryname', 'type'],
  stock: ['stock', 'quantity', 'qty', 'inventory'],
  variants: ['variants', 'variant', 'options'],
  specifications: ['specifications', 'specification', 'specs'],
  images: ['image', 'images', 'imageurl', 'imageurls', 'photo', 'photos'],
};

function normalize(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/(?:[-_\s](?:\d+|copy))$/i, '')
    .replace(/[^a-z0-9]/g, '');
}

function stringValue(value: unknown) {
  return String(value ?? '').trim();
}

function numberValue(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(String(value).replace(/[,₹$]/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function objectValue(value: unknown): Record<string, string> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, string>;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return String(value)
      .split(/[;,|]/)
      .map((part) => part.split(/[:=]/))
      .filter(([key, val]) => key?.trim() && val?.trim())
      .reduce<Record<string, string>>((result, [key, val]) => {
        result[key.trim()] = val.trim();
        return result;
      }, {});
  }
}

function findColumn(headers: string[], field: string) {
  const candidates = aliases[field] || [];
  return headers.findIndex((header) => candidates.includes(normalize(header)));
}

function parseRows(buffer: Buffer, mapping?: Record<string, string>) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const rawHeaders = (matrix[0] || []).map(stringValue);
  const headers = rawHeaders.map(normalize);
  const fields = Object.keys(aliases);
  const indexes = Object.fromEntries(fields.map((field) => [
    field,
    mapping?.[field]
      ? headers.indexOf(normalize(mapping[field]))
      : findColumn(headers, field),
  ]));

  const knownIndexes = new Set(Object.values(indexes).filter((index) => index >= 0));
  const rows = matrix.slice(1).map((cells, index): ImportRow => {
    const value = (field: string) => indexes[field] >= 0 ? cells[indexes[field]] : '';
    const title = stringValue(value('title'));
    const price = numberValue(value('price'));
    const discountPrice = numberValue(value('discountPrice'));
    const stockValue = numberValue(value('stock'));
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!title) errors.push('Product name is required');
    if (price !== null && price < 0) errors.push('Price must be a non-negative number');
    if (price === null) warnings.push('Price is missing; product will be enquiry-only unless configured otherwise');
    if (discountPrice !== null && (discountPrice < 0 || (price !== null && discountPrice > price))) {
      errors.push('Sale price must be between zero and the regular price');
    }
    if (stockValue !== null && (!Number.isInteger(stockValue) || stockValue < 0)) {
      errors.push('Stock must be a non-negative whole number');
    }
    if (!stringValue(value('sku'))) warnings.push('SKU is missing; duplicate detection will use the product name');

    const attributes = rawHeaders.reduce<Record<string, string>>((result, header, headerIndex) => {
      if (!knownIndexes.has(headerIndex) && stringValue(cells[headerIndex])) {
        result[header] = stringValue(cells[headerIndex]);
      }
      return result;
    }, {});

    return {
      rowNumber: index + 2,
      title,
      sku: stringValue(value('sku')),
      brand: stringValue(value('brand')),
      description: stringValue(value('description')),
      price,
      discountPrice,
      category: stringValue(value('category')),
      stock: stockValue === null ? 0 : stockValue,
      variants: objectValue(value('variants')),
      specifications: objectValue(value('specifications')),
      attributes,
      images: [],
      imageNames: [],
      errors,
      warnings,
      status: errors.length ? 'INVALID' : 'MISSING_IMAGE',
    };
  }).filter((row) => row.title || row.sku || row.price !== null);
  const seenSkus = new Set<string>();
  for (const row of rows) {
    if (!row.sku) continue;
    const normalizedSku = row.sku.toLowerCase();
    if (seenSkus.has(normalizedSku)) row.errors.push('Duplicate SKU in spreadsheet');
    seenSkus.add(normalizedSku);
    if (row.errors.length) row.status = 'INVALID';
  }
  return { rows, headers: rawHeaders };
}

function matchImages(rows: ImportRow[], images: Array<{ name: string; url: string }>) {
  const used = new Set<string>();
  const keys = rows.map((row) => ({
    row,
    keys: [normalize(row.sku), normalize(row.title)].filter(Boolean),
  }));

  for (const image of images) {
    const imageKey = normalize(image.name);
    const match = keys.find(({ keys: rowKeys }) => rowKeys.some((key) => key === imageKey));
    if (!match) continue;
    match.row.images.push(image.url);
    match.row.imageNames.push(image.name);
    used.add(image.name);
  }

  for (const row of rows) {
    row.status = row.errors.length ? 'INVALID' : row.images.length ? 'READY' : 'MISSING_IMAGE';
  }
  return images.filter((image) => !used.has(image.name));
}

async function getStore() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return { user: null, store: null };
  const store = await prisma.store.findFirst({ where: { adminId: user.userId } });
  return { user, store };
}

export async function GET(req: NextRequest) {
  try {
    const { user, store } = await getStore();
    if (!user || !store) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    if (new URL(req.url).searchParams.get('template') === '1') {
      const worksheet = XLSX.utils.aoa_to_sheet([[
        'Name', 'SKU', 'Brand', 'Description', 'Price', 'Sale Price',
        'Category', 'Stock', 'Variants', 'Specifications', 'Image',
      ], [
        'Cheese', 'CH001', 'Example Brand', 'Product description', 120, 100,
        'Dairy', 50, '{"Weight":"500g"}', '{"Type":"Cheddar"}', 'cheese.jpg',
      ]]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(output, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="product-import-template.xlsx"',
        },
      });
    }
    const history = await prisma.importHistory.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Import history error:', error);
    return NextResponse.json({ error: 'Failed to load import history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, store } = await getStore();
    if (!user || !store) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const formData = await req.formData();
    const action = stringValue(formData.get('action')) || 'preview';
    const spreadsheet = formData.get('spreadsheet');
    if (action === 'preview' && !(spreadsheet instanceof File)) {
      return NextResponse.json({ error: 'Upload an Excel or CSV file' }, { status: 400 });
    }
    if (spreadsheet instanceof File) {
      const extension = spreadsheet.name.toLowerCase().split('.').pop();
      if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
        return NextResponse.json({ error: 'Only .xlsx, .xls, and .csv files are supported' }, { status: 400 });
      }
    }

    let uploadedImages: UploadedImage[] = [];
    const imageManifest = formData.get('imageManifest');
    if (imageManifest) {
      uploadedImages = JSON.parse(String(imageManifest)) as UploadedImage[];
    }
    const mapping = formData.get('mapping');

    if (action === 'preview') {
      const parsed = parseRows(
        Buffer.from(await (spreadsheet as File).arrayBuffer()),
        mapping ? JSON.parse(String(mapping)) : undefined,
      );
      const rows = parsed.rows;
      const unmatchedImages = matchImages(rows, uploadedImages);
      return NextResponse.json({
        fileName: (spreadsheet as File).name,
        columns: parsed.headers,
        rows,
        unmatchedImages,
        summary: {
          total: rows.length,
          ready: rows.filter((row) => row.status === 'READY').length,
          missingImages: rows.filter((row) => row.status === 'MISSING_IMAGE').length,
          invalid: rows.filter((row) => row.status === 'INVALID').length,
          matchedImages: rows.reduce((count, row) => count + row.images.length, 0),
        },
      });
    }

    const importRows = JSON.parse(String(formData.get('rows') || '[]')) as ImportRow[];
    const errors: Array<{ row: number; message: string }> = [];
    let successfulProducts = 0;
    for (const row of importRows) {
      if (row.errors?.length) {
        errors.push({ row: row.rowNumber, message: row.errors.join('; ') });
        continue;
      }
      if (!row.category?.trim()) {
        errors.push({ row: row.rowNumber, message: 'A category must be assigned before importing' });
        continue;
      }
      try {
        const category = row.category
          ? await prisma.category.upsert({
              where: { storeId_slug: { storeId: store.id, slug: slugify(row.category) } },
              update: { name: row.category },
              create: { storeId: store.id, name: row.category, slug: slugify(row.category) },
            })
          : null;
        const configuredFields = category
          ? await getEffectiveProductFields(store.id, category.id)
          : [];
        const values: Record<string, unknown> = {
          title: row.title,
          sku: row.sku,
          brand: row.brand,
          description: row.description,
          price: row.price,
          discountPrice: row.discountPrice,
          stock: row.stock,
          images: row.images,
          variants: row.variants,
          specifications: row.specifications,
          ...(row.attributes || {}),
        };
        const missingField = configuredFields.find((field) => {
          if (!field.required || field.customerVisibility === 'HIDDEN') return false;
          const value = values[field.key];
          return value === undefined || value === null || value === '';
        });
        if (missingField) {
          errors.push({ row: row.rowNumber, message: `${missingField.label} is required for ${category?.name}` });
          continue;
        }
        const data = {
          storeId: store.id,
          title: row.title.trim(),
          sku: row.sku || null,
          brand: row.brand || null,
          description: row.description || null,
          price: row.price,
          discountPrice: row.discountPrice ?? null,
          stock: row.stock || 0,
          images: row.images || [],
          variants: row.variants || null,
          specifications: row.specifications || null,
          attributes: row.attributes || null,
          categoryId: category?.id || null,
          isActive: true,
        };
        const existing = row.sku
          ? await prisma.product.findFirst({ where: { storeId: store.id, sku: row.sku } })
          : null;
        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data });
        } else {
          await prisma.product.create({ data });
        }
        successfulProducts += 1;
      } catch (error) {
        errors.push({ row: row.rowNumber, message: 'Could not save product; SKU may already exist' });
      }
    }
    await prisma.importHistory.create({
      data: {
        storeId: store.id,
        fileName: stringValue(formData.get('fileName')) || (spreadsheet instanceof File ? spreadsheet.name : 'product-import'),
        totalProducts: importRows.length,
        successfulProducts,
        failedProducts: errors.length,
        matchedImages: importRows.reduce((count, row) => count + (row.images?.length || 0), 0),
        missingImages: importRows.filter((row) => !row.images?.length).length,
        status: errors.length ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
        errors,
      },
    });
    return NextResponse.json({ success: true, successfulProducts, errors });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Failed to process product import' }, { status: 500 });
  }
}
