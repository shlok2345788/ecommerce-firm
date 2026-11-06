'use client';

import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Field = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  customerVisibility: string;
  categoryId: string | null;
  isActive: boolean;
  displayOrder: number;
};

const types = ['text', 'number', 'dropdown', 'checkbox', 'date', 'image', 'object'];

export default function ProductFieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bulkField, setBulkField] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [draft, setDraft] = useState({ label: '', key: '', type: 'text', customerVisibility: 'VISIBLE', categoryId: '', required: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await fetch('/api/admin/product-fields');
    if (!response.ok) throw new Error('Failed to load fields');
    const data = await response.json();
    setFields(data.fields || []);
    setCategories(data.categories || []);
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => { load().catch((error) => console.error(error)); }, []);

  const createField = async () => {
    if (!draft.label.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/product-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create field');
      setDraft({ label: '', key: '', type: 'text', customerVisibility: 'VISIBLE', categoryId: '', required: false });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const updateField = async (field: Field, patch: Partial<Field>) => {
    const next = { ...field, ...patch };
    setFields((current) => current.map((item) => item.id === field.id ? next : item));
    const response = await fetch('/api/admin/product-fields', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!response.ok) await load();
  };

  const removeField = async (field: Field) => {
    const deleteValues = confirm(`Remove "${field.label}" from configuration?\n\nOK keeps existing values hidden. Cancel aborts.`);
    if (!deleteValues) return;
    const permanentlyDelete = confirm('Delete existing values too? This cannot be undone.');
    await fetch(`/api/admin/product-fields?id=${field.id}&deleteValues=${permanentlyDelete}`, { method: 'DELETE' });
    await load();
  };

  const applyBulkValue = async () => {
    if (!bulkField || !selectedProducts.length) return;
    await fetch('/api/admin/product-fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds: selectedProducts, key: bulkField, value: bulkValue }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Product field configuration</h1>
        <p className="mt-1 text-xs text-zinc-500">Control product data, customer visibility, required status, and category-specific fields.</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">Add a custom field</h2>
        <div className="grid gap-3 md:grid-cols-6">
          <Input className="text-xs md:col-span-2" placeholder="Label (e.g. Weight)" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
          <Input className="text-xs" placeholder="Key (optional)" value={draft.key} onChange={(event) => setDraft({ ...draft, key: event.target.value })} />
          <select className="h-9 rounded-md border border-zinc-200 px-2 text-xs" value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{types.map((type) => <option key={type}>{type}</option>)}</select>
          <select className="h-9 rounded-md border border-zinc-200 px-2 text-xs" value={draft.customerVisibility} onChange={(event) => setDraft({ ...draft, customerVisibility: event.target.value })}><option value="VISIBLE">Customer visible</option><option value="HIDDEN">Hidden</option><option value="ADMIN_ONLY">Admin only</option></select>
          <select className="h-9 rounded-md border border-zinc-200 px-2 text-xs" value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        </div>
        <Button className="mt-3" size="sm" onClick={createField} disabled={saving}><Plus className="mr-2 h-4 w-4" />Add field</Button>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 p-4"><h2 className="text-sm font-semibold">Configured fields</h2></div>
        {loading ? <p className="p-4 text-xs text-zinc-500">Loading fields...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500"><tr><th className="p-3">Order</th><th className="p-3">Label / key</th><th className="p-3">Type</th><th className="p-3">Scope</th><th className="p-3">Visibility</th><th className="p-3">Required</th><th className="p-3" /></tr></thead>
              <tbody>{fields.map((field) => <tr key={field.id} className="border-t border-zinc-100">
                <td className="p-3"><Input className="h-8 w-16 text-xs" type="number" value={field.displayOrder} onChange={(event) => updateField(field, { displayOrder: Number(event.target.value) })} /></td>
                <td className="p-3"><Input className="h-8 w-40 text-xs" value={field.label} onChange={(event) => updateField(field, { label: event.target.value })} /><span className="text-[10px] text-zinc-400">{field.key}</span></td>
                <td className="p-3"><select className="h-8 rounded border border-zinc-200 px-2 text-xs" value={field.type} onChange={(event) => updateField(field, { type: event.target.value })}>{types.map((type) => <option key={type}>{type}</option>)}</select></td>
                <td className="p-3">{field.categoryId ? categories.find((category) => category.id === field.categoryId)?.name || 'Category' : 'All products'}</td>
                <td className="p-3"><select className="h-8 rounded border border-zinc-200 px-2 text-xs" value={field.customerVisibility} onChange={(event) => updateField(field, { customerVisibility: event.target.value })}><option value="VISIBLE">Visible</option><option value="HIDDEN">Hidden</option><option value="ADMIN_ONLY">Admin only</option></select></td>
                <td className="p-3"><input type="checkbox" checked={field.required} onChange={(event) => updateField(field, { required: event.target.checked })} /></td>
                <td className="p-3"><Button size="sm" variant="outline" onClick={() => removeField(field)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold">Bulk values for selected products</h2>
        <p className="mb-3 text-xs text-zinc-500">Existing values are preserved for products you do not select.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <select className="h-9 rounded-md border border-zinc-200 px-2 text-xs" value={bulkField} onChange={(event) => setBulkField(event.target.value)}><option value="">Choose field</option>{fields.map((field) => <option key={field.id} value={field.key}>{field.label}</option>)}</select>
          <Input className="text-xs" placeholder="Value to apply" value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} />
          <Button size="sm" onClick={applyBulkValue} disabled={!bulkField || !selectedProducts.length}><Save className="mr-2 h-4 w-4" />Apply to {selectedProducts.length} products</Button>
        </div>
        <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <label key={product.id} className="flex items-center gap-2 rounded border border-zinc-100 p-2 text-xs"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={(event) => setSelectedProducts((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} />{product.title}</label>)}
        </div>
      </section>

      <div className="flex items-center gap-2 text-xs text-zinc-500"><Save className="h-4 w-4" /><span>Changes save immediately. Removing a field keeps values unless you explicitly confirm deletion.</span><Badge variant="info">Server-enforced visibility</Badge></div>
    </div>
  );
}
