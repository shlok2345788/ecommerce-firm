import React from 'react';
import Link from 'next/link';
import { Store, ShieldCheck } from 'lucide-react';

export default function StoreFooter({ store }: { store: any }) {
  return (
    <footer className="bg-white border-t border-zinc-200 mt-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center">
              <Store className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-semibold text-zinc-900 tracking-tight">{store.name}</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
            {store.description || 'Independent merchant offering verified goods with direct offline checkout and cash on delivery.'}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2.5">
            Store Contact
          </h4>
          <div className="space-y-1.5 text-xs text-zinc-600">
            <p>Phone: {store.phone}</p>
            {store.address && <p>Address: {store.address}</p>}
            <p className="text-emerald-700 font-medium">Payment: Cash on Delivery & Store Pickup</p>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2.5">
            Customer Services
          </h4>
          <div className="space-y-1.5 text-xs">
            <Link href={`/store/${store.slug}/track`} className="block text-zinc-600 hover:text-zinc-900">
              Track Order Status
            </Link>
            <a
              href={`https://wa.me/${store.phone.replace(/[^\d+]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-emerald-600 hover:text-emerald-700"
            >
              Contact Merchant on WhatsApp
            </a>
            <Link href="/" className="block text-zinc-400 hover:text-zinc-600">
              OmniStore Platform
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
        <div className="flex items-center gap-1 text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Frictionless Multi-Tenant Commerce</span>
        </div>
      </div>
    </footer>
  );
}
