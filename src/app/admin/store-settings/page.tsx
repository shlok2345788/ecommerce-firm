'use client';

import React, { useEffect, useState } from 'react';
import { slugify } from '@/lib/utils';
import { Save, Check, ExternalLink, Store, Phone, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminStoreSettingsPage() {
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch('/api/admin/store');
        const data = await res.json();
        if (data.store) {
          setStore(data.store);
          setName(data.store.name || '');
          setSlug(data.store.slug || '');
          setLogoUrl(data.store.logoUrl || '');
          setDescription(data.store.description || '');
          setPhone(data.store.phone || '');
          setAddress(data.store.address || '');
        }
      } catch (e) {
        console.error('Failed to load store', e);
      } finally {
        setLoading(false);
      }
    }
    loadStore();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/admin/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slugify(slug),
          logoUrl,
          description,
          phone,
          address,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store settings');
      }

      setStore(data.store);
      setMessage('Store settings successfully updated');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-zinc-500">Loading settings...</div>;
  }

  const liveStoreUrl = typeof window !== 'undefined' ? `${window.location.origin}/store/${slug || store?.slug}` : '';

  return (
    <div className="max-w-4xl space-y-6">
      <div className="pb-2 border-b border-zinc-200">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          Store Configuration & Brand Identity
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Define storefront naming, URL slug, and contact channels for WhatsApp order confirmations
        </p>
      </div>

      {message && (
        <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Live Brand Preview Card */}
      <Card className="border-zinc-200 bg-white">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Storefront Brand Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-12 h-12 rounded-lg object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
            )}

            <div>
              <h2 className="text-base font-bold text-zinc-900">{name || 'Your Store Name'}</h2>
              <p className="text-xs text-zinc-500 mt-0.5 max-w-md">
                {description || 'Store description appears here for customers.'}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500 font-mono">
                {phone && <span>📞 {phone}</span>}
                {address && <span>📍 {address}</span>}
              </div>
            </div>
          </div>

          <a
            href={liveStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0"
          >
            <Button variant="outline" size="sm" className="text-xs">
              Open Storefront <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </a>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-700">Store Public Name *</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aura Home & Living"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-700">Store URL Slug *</label>
                <div className="flex items-center">
                  <span className="text-xs text-zinc-400 bg-zinc-100 border border-r-0 border-zinc-200 h-9 px-2.5 rounded-l-md flex items-center font-mono">
                    /store/
                  </span>
                  <Input
                    required
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="aura-living"
                    className="text-xs h-9 rounded-l-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-zinc-700">Logo Image URL</label>
              <Input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-zinc-700">Store Tagline / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your artisan collection, mission, or specialty..."
                className="w-full p-2.5 rounded-md border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-700">Contact / WhatsApp Phone Number *</label>
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="text-xs h-9"
                />
                <span className="text-[11px] text-zinc-400 block">
                  Customers send 1-click WhatsApp order confirmations to this number.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-700">Business Pickup Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="442 Design District, SoHo, NY"
                  className="text-xs h-9"
                />
                <span className="text-[11px] text-zinc-400 block">
                  Shown on receipts and storefront for store pickup orders.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 flex justify-end">
              <Button type="submit" disabled={saving} size="sm">
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" /> Save Configuration
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
