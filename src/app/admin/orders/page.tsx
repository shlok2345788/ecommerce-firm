'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShoppingBag,
  Download,
  Search,
  FileText,
  Phone,
  Printer,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders?status=${statusFilter}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/admin/orders/export', '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Incoming Orders
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Process customer orders, update shipping progress, and generate customer receipts
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="text-xs shrink-0"
        >
          <Download className="w-4 h-4 mr-1.5" /> Export Orders (CSV)
        </Button>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'CONFIRMED', label: 'Confirmed' },
            { key: 'OUT_FOR_DELIVERY', label: 'Delivery' },
            { key: 'DELIVERED', label: 'Delivered' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                statusFilter === tab.key
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, phone, ID..."
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Orders Table with Skeletons & Empty State */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Shipping Address</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Fulfillment Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <ShoppingBag className="w-8 h-8 text-zinc-300" />
                    <p className="text-xs font-medium text-zinc-600">
                      No incoming orders yet. Share your store link to start receiving orders.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-zinc-900">
                      #{order.id.slice(0, 8)}
                    </span>
                    <div className="text-[11px] text-zinc-400">
                      {formatDate(order.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-900">{order.customerName}</span>
                      {order.customer?._count?.customerOrders > 1 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Repeat ({order.customer._count.customerOrders} orders)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono mt-0.5">
                      <Phone className="w-3 h-3 text-zinc-400" /> {order.customerPhone}
                    </div>
                    {order.customer?.email && (
                      <div className="text-[10px] text-zinc-400 truncate max-w-[170px]">
                        {order.customer.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div
                      className="text-xs text-zinc-600 max-w-[200px] truncate"
                      title={order.shippingAddress}
                    >
                      {order.shippingAddress}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-700">
                    {order.items?.length || 0} items
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold text-zinc-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {order.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="h-7 px-2 rounded border border-zinc-200 bg-zinc-50 text-[11px] font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-950"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="h-7 text-xs px-2"
                      title="View invoice"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> Slip
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Printable Invoice Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedOrderForInvoice(null)}>
          <div
            className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-zinc-100 mb-4">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Customer Order Receipt</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                  Order ID: #{selectedOrderForInvoice.id}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {formatDate(selectedOrderForInvoice.createdAt)}
                </p>
              </div>
              <button onClick={() => setSelectedOrderForInvoice(null)} className="text-zinc-400 hover:text-zinc-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer Box */}
            <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80 mb-4 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-zinc-400 text-[11px] block uppercase font-medium">Customer</span>
                  <span className="font-semibold text-zinc-900">{selectedOrderForInvoice.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[11px] block uppercase font-medium">Contact</span>
                  <span className="font-mono text-zinc-800">{selectedOrderForInvoice.customerPhone}</span>
                </div>
              </div>
              <div>
                <span className="text-zinc-400 text-[11px] block uppercase font-medium">Delivery Address</span>
                <span className="text-zinc-700">{selectedOrderForInvoice.shippingAddress}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200/60">
                <span>Payment: <strong className="text-zinc-900">{selectedOrderForInvoice.paymentMethod}</strong></span>
                <span>Status: <strong className="text-emerald-700">{selectedOrderForInvoice.status}</strong></span>
              </div>
            </div>

            {/* Line items */}
            <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-2">
              Line Items
            </h4>
            <div className="divide-y divide-zinc-100 text-xs mb-4">
              {selectedOrderForInvoice.items?.map((item: any) => (
                <div key={item.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-zinc-900">{item.product?.title || 'Item'}</span>
                    <span className="text-zinc-400 ml-1.5">× {item.quantity}</span>
                  </div>
                  <span className="font-semibold text-zinc-900">
                    {formatCurrency(Number(item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center py-2.5 border-t border-zinc-200 text-sm font-semibold text-zinc-900 mb-4">
              <span>Total Payable</span>
              <span className="text-base text-zinc-900 font-bold">
                {formatCurrency(selectedOrderForInvoice.totalAmount)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedOrderForInvoice(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
