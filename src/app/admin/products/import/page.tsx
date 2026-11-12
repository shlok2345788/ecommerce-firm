'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  FileSpreadsheet,
  ImageIcon,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
  images: string[];
  imageNames: string[];
  errors: string[];
  warnings: string[];
  status: string;
  variants: Record<string, string>;
  specifications: Record<string, string>;
  attributes: Record<string, string>;
};

type Category = { id: string; name: string; slug: string };
type UploadedImage = { name: string; url: string };

const fields = ['title', 'sku', 'brand', 'description', 'price', 'discountPrice', 'category', 'stock', 'variants', 'specifications', 'images'];
const MAX_UPLOAD_BATCH_SIZE = 3.5 * 1024 * 1024;

async function readImportResponse(response: Response) {
  const responseText = await response.text();
  try {
    return JSON.parse(responseText) as Record<string, any>;
  } catch {
    throw new Error(
      response.status === 413
        ? 'Request is too large for Vercel. Use smaller spreadsheet rows or image batches.'
        : `Import failed (${response.status})`
    );
  }
}

export default function ProductImportPage() {
  const spreadsheetRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [unmatched, setUnmatched] = useState<{ name: string; url: string }[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryMode, setCategoryMode] = useState<'single' | 'individual' | 'automatic'>('automatic');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryAssignments, setCategoryAssignments] = useState<Record<number, string>>({});
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const createCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not create category');
      setCategories((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      setMessage(`Category "${result.category.name}" created. You can now map it.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const assignSelectedCategory = (categoryId: string) => {
    if (!categoryId) return;
    setRows((current) => current.map((row, index) => {
      if (!selected.includes(index)) return row;
      const category = categories.find((item) => item.id === categoryId);
      return { ...row, category: category?.name || row.category };
    }));
    setCategoryAssignments((current) => {
      const next = { ...current };
      selected.forEach((index) => { next[index] = categoryId; });
      return next;
    });
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products/import'),
      fetch('/api/admin/categories'),
    ])
      .then(async ([historyResponse, categoriesResponse]) => {
        if (!historyResponse.ok || !categoriesResponse.ok) throw new Error('Failed to load import settings');
        const [historyResult, categoriesResult] = await Promise.all([
          historyResponse.json(),
          categoriesResponse.json(),
        ]);
        setHistory(historyResult.history || []);
        setCategories(categoriesResult.categories || []);
      })
      .catch((reason) => console.error(reason));
  }, []);

  const chooseImages = (files: FileList | null) => {
    if (files) {
      setImages(Array.from(files));
      setUploadedImages([]);
    }
  };

  const uploadImages = async () => {
    if (!images.length) return [];
    const uploaded: UploadedImage[] = [];
    let batch: File[] = [];
    let batchSize = 0;
    const batches: File[][] = [];
    for (const image of images) {
      if (image.size > MAX_UPLOAD_BATCH_SIZE) {
        throw new Error(`"${image.name}" is too large. Images must be below 3.5 MB.`);
      }
      if (batch.length && batchSize + image.size > MAX_UPLOAD_BATCH_SIZE) {
        batches.push(batch);
        batch = [];
        batchSize = 0;
      }
      batch.push(image);
      batchSize += image.size;
    }
    if (batch.length) batches.push(batch);
    for (const files of batches) {
      const data = new FormData();
      files.forEach((file) => data.append('files', file));
      const response = await fetch('/api/admin/upload', { method: 'POST', body: data });
      const result = await readImportResponse(response);
      if (!response.ok) throw new Error(result.error || 'Could not upload images');
      uploaded.push(...((result.files || []) as UploadedImage[]));
    }
    setUploadedImages(uploaded);
    return uploaded;
  };

  const removeUploadedImage = (imageName: string) => {
    setUnmatched((current) => current.filter((image) => image.name !== imageName));
    setUploadedImages((current) => current.filter((image) => image.name !== imageName));
    setImages((current) => current.filter((image) => image.name !== imageName));
    setMessage(`Removed "${imageName}" from this import.`);
  };

  const preview = async () => {
    if (!spreadsheet) {
      setError('Choose an Excel or CSV file first.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const manifest = uploadedImages.length ? uploadedImages : await uploadImages();
      const data = new FormData();
      data.append('spreadsheet', spreadsheet);
      data.append('action', 'preview');
      data.append('mapping', JSON.stringify(mapping));
      data.append('imageManifest', JSON.stringify(manifest));
      const response = await fetch('/api/admin/products/import', { method: 'POST', body: data });
      const result = await readImportResponse(response);
      if (!response.ok) throw new Error(result.error || 'Could not preview import');
      setRows(result.rows || []);
      setUnmatched(result.unmatchedImages || []);
      setColumns(result.columns || []);
      setSummary(result.summary);
      setCategoryAssignments(Object.fromEntries((result.rows || []).map((row: ImportRow, index: number) => {
        const category = categories.find((item) => item.slug === row.category || item.name.toLowerCase() === row.category.toLowerCase());
        return [index, category?.id || ''];
      })));
      setMessage('Preview generated. Review errors and image matches before importing.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not preview import');
    } finally {
      setLoading(false);
    }
  };

  const importProducts = async () => {
    if (!spreadsheet || !rows.length) return;
    const assignedRows = rows.map((row, index) => {
      const categoryId = categoryMode === 'single' ? selectedCategoryId : categoryAssignments[index];
      const category = categories.find((item) => item.id === categoryId);
      const attributes = { ...row.attributes };
      Object.entries(fieldMapping).forEach(([fieldKey, column]) => {
        if (column && attributes[column] !== undefined) {
          attributes[fieldKey] = attributes[column];
        }
      });
      return { ...row, category: category?.name || row.category, attributes };
    });
    const missingCategories = assignedRows.filter((row, index) =>
      !row.category.trim() ||
      (categoryMode === 'individual' && !categoryAssignments[index]) ||
      (categoryMode === 'automatic' && !categories.some((category) =>
        category.name.toLowerCase() === row.category.trim().toLowerCase() ||
        category.slug === row.category.trim()
      ))
    );
    if (categoryMode === 'single' && !selectedCategoryId) {
      setError('Select a category before importing products.');
      return;
    }
    if (categoryMode === 'individual' && missingCategories.length) {
      setError(`Assign a category to ${missingCategories.length} product(s) before importing.`);
      return;
    }
    if (categoryMode === 'automatic' && missingCategories.length) {
      setError('Map every spreadsheet category to an existing category or create it before importing.');
      return;
    }
    if (missingRequiredFieldRows.length) {
      setError(`${missingRequiredFieldRows.length} product(s) are missing required category fields.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('action', 'import');
      data.append('fileName', spreadsheet.name);
      data.append('rows', JSON.stringify(assignedRows));
      const response = await fetch('/api/admin/products/import', { method: 'POST', body: data });
      const result = await readImportResponse(response);
      if (!response.ok) throw new Error(result.error || 'Import failed');
      setMessage(`Imported ${result.successfulProducts} products. ${result.errors?.length || 0} rows failed.`);
      setHistory((current) => [{
        fileName: spreadsheet.name,
        totalProducts: rows.length,
        successfulProducts: result.successfulProducts,
        failedProducts: result.errors?.length || 0,
        matchedImages: rows.reduce((count, row) => count + row.images.length, 0),
        missingImages: rows.filter((row) => !row.images.length).length,
        status: result.errors?.length ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
        createdAt: new Date().toISOString(),
      }, ...current]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const setRowCategory = (index: number, categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    setCategoryAssignments((current) => ({ ...current, [index]: categoryId }));
    updateRow(index, { category: category?.name || '' });
  };

  const unmatchedCategoryNames = Array.from(new Set(rows.map((row) => row.category.trim()).filter((name) =>
    name && !categories.some((category) => category.name.toLowerCase() === name.toLowerCase() || category.slug === name)
  )));

  const mapCategoryName = (sourceName: string, categoryId: string) => {
    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;
    setRows((current) => current.map((row) =>
      row.category.trim().toLowerCase() === sourceName.toLowerCase()
        ? { ...row, category: category.name }
        : row
    ));
    setCategoryAssignments((current) => {
      const next = { ...current };
      rows.forEach((row, index) => {
        if (row.category.trim().toLowerCase() === sourceName.toLowerCase()) next[index] = categoryId;
      });
      return next;
    });
  };

  useEffect(() => {
    const categoryIds = categoryMode === 'single'
      ? [selectedCategoryId]
      : Object.values(categoryAssignments);
    const ids = categoryIds.filter(Boolean);
    if (!ids.length) {
      setCategoryFields([]);
      return;
    }
    fetch('/api/admin/product-fields')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Failed to load category fields')))
      .then((result) => {
        const allowed = new Set(ids);
        setCategoryFields((result.fields || []).filter((field: any) => !field.categoryId || allowed.has(field.categoryId)));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Failed to load category fields'));
  }, [categoryMode, selectedCategoryId, categoryAssignments]);

  const updateRow = (index: number, patch: Partial<ImportRow>) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const applyBulkEdit = () => {
    const price = bulkPrice === '' ? null : Number(bulkPrice);
    const stock = bulkStock === '' ? null : Number(bulkStock);
    setRows((current) => current.map((row, index) => selected.includes(index)
      ? { ...row, price: price === null ? row.price : price, stock: stock === null ? row.stock : stock }
      : row));
    setBulkPrice('');
    setBulkStock('');
  };

  const visibleRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => `${row.title} ${row.sku} ${row.category}`.toLowerCase().includes(query.toLowerCase()));

  const categoryIdForRow = (row: ImportRow, index: number) => {
    if (categoryMode === 'single') return selectedCategoryId;
    if (categoryAssignments[index]) return categoryAssignments[index];
    return categories.find((category) =>
      category.name.toLowerCase() === row.category.trim().toLowerCase() ||
      category.slug === row.category.trim()
    )?.id || '';
  };

  const missingRequiredFieldRows = rows.filter((row, index) => {
    const categoryId = categoryIdForRow(row, index);
    if (!categoryId) return false;
    return categoryFields
      .filter((field) => !field.categoryId || field.categoryId === categoryId)
      .some((field) => {
        if (!field.required) return false;
        const value = field.key === 'title' ? row.title
          : field.key === 'sku' ? row.sku
          : field.key === 'brand' ? row.brand
          : field.key === 'description' ? row.description
          : field.key === 'price' ? row.price
          : field.key === 'discountPrice' ? row.discountPrice
          : field.key === 'stock' ? row.stock
          : field.key === 'images' ? row.images
          : row.attributes[field.key] || (fieldMapping[field.key] ? row.attributes[fieldMapping[field.key]] : null);
        return value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0);
      });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bulk Product Import</h1>
          <p className="mt-1 text-xs text-zinc-500">Import up to 1,000 products while images upload in safe batches.</p>
        </div>
        <a href="/api/admin/products/import?template=1" download>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Excel template</Button>
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            <div><h2 className="text-sm font-semibold">1. Product spreadsheet</h2><p className="text-xs text-zinc-500">XLSX, XLS, or CSV</p></div>
          </div>
          <input ref={spreadsheetRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={(event) => setSpreadsheet(event.target.files?.[0] || null)} />
          <Button variant="outline" className="mt-4 w-full" onClick={() => spreadsheetRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{spreadsheet?.name || 'Choose spreadsheet'}</Button>
        </section>
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-5">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            <div><h2 className="text-sm font-semibold">2. Product images</h2><p className="text-xs text-zinc-500">Images upload in automatic batches; names are matched safely</p></div>
          </div>
          <input ref={imageRef} hidden type="file" accept="image/*" multiple onChange={(event) => chooseImages(event.target.files)} />
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { imageRef.current?.removeAttribute('webkitdirectory'); imageRef.current?.click(); }}><Upload className="mr-2 h-4 w-4" />Choose images ({images.length})</Button>
            <Button variant="outline" onClick={() => { imageRef.current?.setAttribute('webkitdirectory', ''); imageRef.current?.click(); }}>Folder</Button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">Use filenames such as cheese.jpg, cheese-1.jpg, or CH001.png.</p>
        </section>
      </div>

      {columns.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Column mapping</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {fields.map((field) => (
              <label key={field} className="text-xs text-zinc-600">
                {field}
                <select className="mt-1 h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs" value={mapping[field] || ''} onChange={(event) => setMapping({ ...mapping, [field]: event.target.value })}>
                  <option value="">Automatic</option>
                  {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                </select>
              </label>
            ))}
          </div>
          <Button className="mt-4" size="sm" onClick={preview}>Rebuild preview with mapping</Button>
        </section>
      )}

      {rows.length > 0 && (
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold">3. Choose product category</h2>
            <p className="mt-1 text-xs text-zinc-500">Every imported product must have a category before it can be saved.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {(['automatic', 'single', 'individual'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setCategoryMode(mode)} className={`rounded-lg border p-3 text-left text-xs ${categoryMode === mode ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'}`}>
                <span className="font-semibold">{mode === 'automatic' ? 'Automatic mapping' : mode === 'single' ? 'Single category' : 'Individual mapping'}</span>
                <span className="mt-1 block text-zinc-500">{mode === 'automatic' ? 'Use the spreadsheet Category column.' : mode === 'single' ? 'Assign one category to all rows.' : 'Choose a category per product.'}</span>
              </button>
            ))}
          </div>
          {(categoryMode === 'single' || categoryMode === 'automatic') && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Search categories..." value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} />
              <select className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs" value={selectedCategoryId} onChange={(event) => setSelectedCategoryId(event.target.value)}>
                <option value="">{categoryMode === 'automatic' ? 'Use spreadsheet categories' : 'Select a category'}</option>
                {filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
          )}
          {categoryMode === 'individual' && (
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <select className="h-9 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs" defaultValue="" onChange={(event) => assignSelectedCategory(event.target.value)}>
                  <option value="">Assign selected products to...</option>
                  {filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <span className="self-center text-[11px] text-zinc-500">{selected.length} selected</span>
              </div>
              {visibleRows.map(({ row, index }) => (
                <div key={row.rowNumber} className="grid gap-2 rounded-md border border-zinc-100 p-2 sm:grid-cols-[1fr_220px] sm:items-center">
                  <span className="truncate text-xs">{row.title}</span>
                  <select className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs" value={categoryAssignments[index] || ''} onChange={(event) => setRowCategory(index, event.target.value)}>
                    <option value="">Select category</option>
                    {filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          {categoryMode === 'automatic' && unmatchedCategoryNames.length > 0 && (
            <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/50 p-3">
              <p className="text-xs font-semibold text-amber-900">Unmatched spreadsheet categories</p>
              {unmatchedCategoryNames.map((name) => (
                <div key={name} className="grid gap-2 sm:grid-cols-[1fr_220px] sm:items-center">
                  <span className="truncate text-xs text-amber-900">{name}</span>
                  <select className="h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs" defaultValue="" onChange={(event) => mapCategoryName(name, event.target.value)}>
                    <option value="">Map to existing category</option>
                    {filteredCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </div>
              ))}
              <p className="text-[11px] text-amber-800">Create new categories from Catalog Categories first, then map them here. Duplicate categories are never created by this step.</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input className="h-9 flex-1 bg-white text-xs" placeholder="New category name" value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} />
                <Button type="button" size="sm" variant="outline" onClick={createCategory} disabled={creatingCategory || !newCategoryName.trim()}>{creatingCategory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create category</Button>
              </div>
            </div>
          )}
          {categoryFields.length > 0 && (
            <div className="rounded-md bg-zinc-50 p-3">
              <p className="text-xs font-semibold">Fields for selected categories</p>
              <div className="mt-2 flex flex-wrap gap-2">{categoryFields.map((field) => <Badge key={field.id} variant={field.required ? 'warning' : 'default'}>{field.label}{field.required ? ' *' : ''}</Badge>)}</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {categoryFields.filter((field) => !['title', 'category', 'price', 'discountPrice', 'stock', 'images', 'sku', 'brand', 'description'].includes(field.key)).map((field) => (
                  <label key={field.id} className="text-[11px] text-zinc-600">
                    Map {field.label}{field.required ? ' *' : ''}
                    <select className="mt-1 h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs" value={fieldMapping[field.key] || ''} onChange={(event) => setFieldMapping((current) => ({ ...current, [field.key]: event.target.value }))}>
                      <option value="">Not mapped</option>
                      {columns.map((column) => <option key={column} value={column}>{column}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-md border border-zinc-100 p-3">
            <p className="text-xs font-semibold">Import confirmation</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-600 sm:grid-cols-4">
              <span>{rows.length} products</span>
              <span>{new Set(rows.map((row) => row.category).filter(Boolean)).size} categories</span>
              <span>{rows.filter((row) => !row.category.trim()).length} without category</span>
              <span>{unmatchedCategoryNames.length} unmatched</span>
              <span>{missingRequiredFieldRows.length} missing required fields</span>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={preview} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Preview import</Button>
        <Button variant="outline" onClick={importProducts} disabled={loading || !rows.length}>Confirm and import</Button>
        {summary && <div className="flex items-center gap-2 text-xs"><Badge variant="info">{summary.total} detected</Badge><Badge variant="success">{summary.ready} ready</Badge><Badge variant="warning">{summary.missingImages} missing images</Badge><Badge variant="destructive">{summary.invalid} invalid</Badge></div>}
      </div>

      {error && <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      {message && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{message}</div>}

      {rows.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 lg:flex-row lg:items-center">
            <Input className="h-9 max-w-sm text-xs" placeholder="Search preview..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Input className="h-9 w-28 text-xs" placeholder="Set price" value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} />
              <Input className="h-9 w-28 text-xs" placeholder="Set stock" value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} />
              <Button size="sm" variant="outline" onClick={applyBulkEdit}>Apply to selected</Button>
            </div>
          </div>
          <div className="space-y-2 p-3 md:hidden">
            {visibleRows.map(({ row, index }) => (
              <article key={row.rowNumber} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex gap-3">
                  {row.images[0] ? <img src={row.images[0]} alt="" className="h-14 w-14 rounded-md object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] text-zinc-400">No image</div>}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Input className="h-8 min-w-0 text-xs" value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} />
                      <input type="checkbox" className="mt-2 h-4 w-4 shrink-0" checked={selected.includes(index)} onChange={(event) => setSelected(event.target.checked ? [...selected, index] : selected.filter((item) => item !== index))} />
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-500">{row.sku || 'No SKU'} · {row.category || 'No category'}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input className="h-9 text-xs" type="number" value={row.price ?? ''} placeholder="Price" onChange={(event) => updateRow(index, { price: event.target.value === '' ? null : Number(event.target.value) })} />
                  <Input className="h-9 text-xs" type="number" value={row.stock} placeholder="Stock" onChange={(event) => updateRow(index, { stock: Number(event.target.value) })} />
                </div>
                <div className="mt-2">{row.status === 'READY' ? <Badge variant="success">Ready</Badge> : row.status === 'MISSING_IMAGE' ? <Badge variant="warning">Missing image</Badge> : <Badge variant="destructive">Invalid</Badge>}</div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500"><tr><th className="p-3"><input type="checkbox" onChange={(event) => setSelected(event.target.checked ? visibleRows.map(({ index }) => index) : [])} /></th><th className="p-3">Image</th><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {visibleRows.map(({ row, index }) => (
                  <tr key={row.rowNumber} className="border-t border-zinc-100 align-top">
                    <td className="p-3"><input type="checkbox" checked={selected.includes(index)} onChange={(event) => setSelected(event.target.checked ? [...selected, index] : selected.filter((item) => item !== index))} /></td>
                    <td className="p-3">{row.images[0] ? <img src={row.images[0]} alt="" className="h-12 w-12 rounded-md object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 text-[10px] text-zinc-400">No image</div>}</td>
                    <td className="p-3"><Input className="h-8 w-44 text-xs" value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} /><div className="mt-1 text-[10px] text-zinc-400">row {row.rowNumber}</div></td>
                    <td className="p-3"><Input className="h-8 w-28 text-xs" value={row.sku} onChange={(event) => updateRow(index, { sku: event.target.value })} /></td>
                    <td className="p-3"><Input className="h-8 w-24 text-xs" type="number" value={row.price ?? ''} onChange={(event) => updateRow(index, { price: event.target.value === '' ? null : Number(event.target.value) })} /></td>
                    <td className="p-3"><Input className="h-8 w-20 text-xs" type="number" value={row.stock} onChange={(event) => updateRow(index, { stock: Number(event.target.value) })} /></td>
                    <td className="p-3">{row.status === 'READY' ? <Badge variant="success">Ready</Badge> : row.status === 'MISSING_IMAGE' ? <Badge variant="warning">Missing image</Badge> : <Badge variant="destructive">Invalid</Badge>}<div className="mt-1 max-w-48 text-[10px] text-red-600">{row.errors.join('; ')}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {unmatched.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Unmatched images ({unmatched.length})</h2><span className="text-xs text-zinc-500">No automatic assignment was made.</span></div>
          <div className="flex flex-wrap gap-3">{unmatched.map((image) => <div key={image.name} className="w-40 rounded-md border border-amber-200 bg-white p-1"><div className="relative"><img src={image.url} alt={image.name} className="h-20 w-full rounded object-cover" /><button type="button" aria-label={`Remove ${image.name}`} title="Remove image" className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-zinc-600 shadow hover:bg-red-50 hover:text-red-600" onClick={() => removeUploadedImage(image.name)}><X className="h-3 w-3" /></button></div><p className="truncate p-1 text-[10px]">{image.name}</p><select className="h-7 w-full rounded border border-zinc-200 px-1 text-[10px]" defaultValue="" onChange={(event) => { const index = Number(event.target.value); if (Number.isNaN(index)) return; updateRow(index, { images: [...rows[index].images, image.url], imageNames: [...rows[index].imageNames, image.name], status: 'READY' }); setUnmatched((current) => current.filter((item) => item.name !== image.name)); }}><option value="">Assign to...</option>{rows.map((row, index) => <option key={row.rowNumber} value={index}>{row.title}</option>)}</select></div>)}</div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Import history</h2>
        {history.length === 0 ? <p className="text-xs text-zinc-500">No imports recorded yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="text-zinc-500"><tr><th className="p-2">File</th><th className="p-2">Date</th><th className="p-2">Products</th><th className="p-2">Images</th><th className="p-2">Status</th></tr></thead>
              <tbody>{history.map((item, index) => <tr key={`${item.id || item.fileName}-${index}`} className="border-t border-zinc-100"><td className="p-2 font-medium">{item.fileName}</td><td className="p-2 text-zinc-500">{new Date(item.createdAt).toLocaleString()}</td><td className="p-2">{item.successfulProducts}/{item.totalProducts} successful</td><td className="p-2">{item.matchedImages} matched, {item.missingImages} missing</td><td className="p-2"><Badge variant={item.status === 'COMPLETED' ? 'success' : 'warning'}>{item.status}</Badge></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
