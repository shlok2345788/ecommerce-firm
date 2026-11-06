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

const fields = ['title', 'sku', 'brand', 'description', 'price', 'discountPrice', 'category', 'stock', 'variants', 'specifications', 'images'];

export default function ProductImportPage() {
  const spreadsheetRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [spreadsheet, setSpreadsheet] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);
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

  useEffect(() => {
    fetch('/api/admin/products/import')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Failed to load import history')))
      .then((result) => setHistory(result.history || []))
      .catch((reason) => console.error(reason));
  }, []);

  const chooseImages = (files: FileList | null) => {
    if (files) setImages(Array.from(files));
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
      const data = new FormData();
      data.append('spreadsheet', spreadsheet);
      data.append('action', 'preview');
      data.append('mapping', JSON.stringify(mapping));
      images.forEach((image) => data.append('images', image));
      const response = await fetch('/api/admin/products/import', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not preview import');
      setRows(result.rows || []);
      setUnmatched(result.unmatchedImages || []);
      setColumns(result.columns || []);
      setSummary(result.summary);
      setMessage('Preview generated. Review errors and image matches before importing.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not preview import');
    } finally {
      setLoading(false);
    }
  };

  const importProducts = async () => {
    if (!spreadsheet || !rows.length) return;
    setLoading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('spreadsheet', spreadsheet);
      data.append('action', 'import');
      data.append('rows', JSON.stringify(rows));
      images.forEach((image) => data.append('images', image));
      const response = await fetch('/api/admin/products/import', { method: 'POST', body: data });
      const result = await response.json();
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Bulk Product Import</h1>
          <p className="mt-1 text-xs text-zinc-500">Import products, match thousands of images, and edit records before publishing.</p>
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
            <div><h2 className="text-sm font-semibold">2. Product images</h2><p className="text-xs text-zinc-500">Multiple files or a folder; names are matched safely</p></div>
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

      <div className="flex flex-wrap gap-2">
        <Button onClick={preview} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Preview import</Button>
        <Button variant="outline" onClick={importProducts} disabled={loading || !rows.length}>Import valid products</Button>
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
          <div className="overflow-x-auto">
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
          <div className="flex flex-wrap gap-3">{unmatched.map((image) => <div key={image.name} className="w-40 rounded-md border border-amber-200 bg-white p-1"><img src={image.url} alt={image.name} className="h-20 w-full rounded object-cover" /><p className="truncate p-1 text-[10px]">{image.name}</p><select className="h-7 w-full rounded border border-zinc-200 px-1 text-[10px]" defaultValue="" onChange={(event) => { const index = Number(event.target.value); if (Number.isNaN(index)) return; updateRow(index, { images: [...rows[index].images, image.url], imageNames: [...rows[index].imageNames, image.name], status: 'READY' }); setUnmatched(unmatched.filter((item) => item.name !== image.name)); }}><option value="">Assign to...</option>{rows.map((row, index) => <option key={row.rowNumber} value={index}>{row.title}</option>)}</select></div>)}</div>
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
