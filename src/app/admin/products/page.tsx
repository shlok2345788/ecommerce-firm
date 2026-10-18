'use client';

import React, { useEffect, useState, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  ImageOff,
  Loader2,
  Check,
  Upload,
  AlertCircle,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>(['']);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Image Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      const newUrls: string[] = data.urls || [data.url];
      // Filter out empty placeholders and append new uploaded URLs
      setImages((prev) => [...prev.filter((u) => u.trim().length > 0), ...newUrls]);
    } catch (err: any) {
      setUploadError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();

      setProducts(pData.products || []);
      setCategories(cData.categories || []);
    } catch (e) {
      console.error('Failed to load products/categories', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setStock('10');
    setCategoryId(categories[0]?.id || '');
    setImages(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']);
    setIsActive(true);
    setFormError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setDescription(prod.description || '');
    setPrice(prod.price.toString());
    setDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : '');
    setStock(prod.stock.toString());
    setCategoryId(prod.categoryId || '');
    setImages(prod.images && prod.images.length > 0 ? prod.images : ['']);
    setIsActive(prod.isActive);
    setFormError(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (index: number, val: string) => {
    const updated = [...images];
    updated[index] = val;
    setImages(updated);
  };

  const addImageField = () => {
    setImages([...images, '']);
  };

  const removeImageField = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const cleanedImages = images.map((i) => i.trim()).filter(Boolean);
      const payload = {
        title,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock, 10),
        categoryId: categoryId || null,
        images: cleanedImages,
        isActive,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (prod: any) => {
    try {
      await fetch(`/api/admin/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !prod.isActive }),
      });
      fetchData();
    } catch (e) {
      console.error('Failed to toggle active', e);
    }
  };

  const handleDelete = async (id: string, prodTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${prodTitle}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Failed to delete product', e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Products Catalog
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage your store's inventory, pricing tiers, and showcase media
          </p>
        </div>

        <Button onClick={openCreateModal} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-md border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-zinc-500">
          Showing <strong>{filteredProducts.length}</strong> of {products.length} products
        </span>
      </div>

      {/* Products Table with Skeletons & Empty State */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Store Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-44" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Package className="w-8 h-8 text-zinc-300" />
                    <p className="text-xs font-medium text-zinc-600">
                      No products added yet. Click &apos;Add Product&apos; to list your first item.
                    </p>
                    <Button onClick={openCreateModal} variant="outline" size="sm" className="text-xs mt-2">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Product
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((prod) => {
                const img = prod.images?.[0];
                return (
                  <TableRow key={prod.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 flex items-center justify-center">
                          {img ? (
                            <img src={img} alt={prod.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageOff className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-xs text-zinc-900 truncate max-w-[240px]">
                            {prod.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate max-w-[240px]">
                            {prod.description || 'No description'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600">
                      {prod.category?.name || 'Uncategorized'}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-semibold text-zinc-900">
                        {formatCurrency(prod.discountPrice || prod.price)}
                      </div>
                      {prod.discountPrice && (
                        <span className="text-[11px] text-zinc-400 line-through">
                          {formatCurrency(prod.price)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {prod.stock <= 0 ? (
                        <span className="badge-cancelled">Out of stock</span>
                      ) : prod.stock <= 5 ? (
                        <span className="badge-pending">Low: {prod.stock}</span>
                      ) : (
                        <span className="badge-active">{prod.stock} in stock</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(prod)}
                        className={prod.isActive ? 'badge-active' : 'badge-inactive'}
                        title="Click to toggle store visibility"
                      >
                        {prod.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(prod)}
                          className="h-7 text-xs px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(prod.id, prod.title)}
                          className="h-7 text-xs px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Product Form Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
          <div
            className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="text-base font-semibold text-zinc-900">
                {editingProduct ? 'Edit Catalog Item' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-zinc-700">Product Title *</label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Minimalist Ceramic Vessel"
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-8 px-2 rounded-md border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Stock Units *</label>
                  <Input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Regular Price (₹) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="999.00"
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-zinc-700">Discount Price (₹) (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Leave blank if none"
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-zinc-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Materials, specifications, dimensions, or styling notes..."
                  className="w-full p-2.5 rounded-md border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  rows={3}
                />
              </div>

              {/* Product Images: File Upload & URLs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-zinc-700">Product Images</label>
                  <span className="text-[11px] text-zinc-400">Upload files or enter URLs</span>
                </div>

                {/* File Upload Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUpload(e.dataTransfer.files);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-zinc-900 bg-zinc-100'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/70 hover:bg-zinc-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />

                  {uploading ? (
                    <div className="flex flex-col items-center justify-center py-1 text-zinc-600">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-900 mb-1" />
                      <span className="text-xs font-medium">Uploading image...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1">
                      <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 mb-1.5 shadow-xs">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-900">
                        Click to upload images <span className="font-normal text-zinc-500">or drag & drop</span>
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        PNG, JPG, WEBP, GIF up to 5MB (Multiple uploads supported)
                      </p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                  </p>
                )}

                {/* Image Thumbnail Previews */}
                {images.filter((img) => img.trim().length > 0).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {images
                      .filter((img) => img.trim().length > 0)
                      .map((img, idx) => (
                        <div
                          key={idx}
                          className="group relative w-16 h-16 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-100 shrink-0"
                        >
                          <img
                            src={img}
                            alt={`Product preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-zinc-900/80 text-white text-[9px] font-bold text-center py-0.5 leading-none">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImageField(idx);
                            }}
                            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove image"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Direct Image URL Inputs */}
                <div className="pt-1.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-medium text-zinc-600">
                      Image URLs ({images.length})
                    </span>
                    <button
                      type="button"
                      onClick={addImageField}
                      className="text-[11px] font-medium text-zinc-900 hover:underline inline-flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Add URL
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <Input
                          type="text"
                          value={img}
                          onChange={(e) => handleImageChange(idx, e.target.value)}
                          placeholder="https://... or /uploads/..."
                          className="text-xs h-7 flex-1 font-mono"
                        />
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(idx)}
                            className="text-zinc-400 hover:text-red-600 p-1"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-950"
                />
                <label htmlFor="activeToggle" className="font-medium text-zinc-800 cursor-pointer">
                  Publish to storefront immediately
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                    </>
                  ) : editingProduct ? (
                    'Save Changes'
                  ) : (
                    'Create Product'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
