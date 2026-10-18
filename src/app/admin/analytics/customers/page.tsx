'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Users,
  Repeat,
  IndianRupee,
  Search,
  Eye,
  ShoppingBag,
  Phone,
  Mail,
  Calendar,
  X,
  Package,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CustomerOrder {
  id: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  shippingAddress: string;
  customerPhone: string;
  createdAt: string;
  itemsCount: number;
  items: Array<{
    id: string;
    productId: string;
    title: string;
    image: string | null;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface TopProduct {
  productId: string;
  title: string;
  image: string | null;
  totalQuantity: number;
  totalSpent: number;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  totalOrdersPlaced: number;
  lifetimeSpent: number;
  lastOrderDate: string | null;
  top3Items: TopProduct[];
  orders: CustomerOrder[];
}

export default function CustomerAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'repeat' | 'single' | 'zero'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/analytics/customers');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error('Failed to load customer analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'repeat') return c.totalOrdersPlaced >= 2;
    if (filterType === 'single') return c.totalOrdersPlaced === 1;
    if (filterType === 'zero') return c.totalOrdersPlaced === 0;

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80';
      case 'CONFIRMED':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'OUT_FOR_DELIVERY':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200/80';
      case 'DELIVERED':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'CANCELLED':
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200/80';
      default:
        return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Customer Analytics
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Registered customer insights, lifetime value, and individual repeat buyer behavior
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalytics}
          className="text-xs self-start sm:self-auto"
        >
          Refresh Data
        </Button>
      </div>

      {/* Metrics Overview Row (Clean, Anti-AI Muted Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2 border-zinc-200 bg-white">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </Card>
          ))
        ) : (
          <>
            {/* Metric 1: Total Registered Customers */}
            <Card className="p-4 border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Total Registered Customers
                </span>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {metrics?.totalRegisteredCustomers || 0}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Locked accounts under role CUSTOMER
              </p>
            </Card>

            {/* Metric 2: Repeat Customer Rate */}
            <Card className="p-4 border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Repeat Customer Rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                  <Repeat className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {metrics?.repeatCustomerRate !== undefined ? `${metrics.repeatCustomerRate}%` : '0%'}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Buyers with 2 or more placed orders
              </p>
            </Card>

            {/* Metric 3: Average Order Value per Customer */}
            <Card className="p-4 border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Average Order Value per Customer
                </span>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                {formatCurrency(metrics?.averageOrderValue || 0)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Avg lifetime spent: {formatCurrency(metrics?.averageLifetimeSpent || 0)}
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Table Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer by name, phone, or email..."
            className="pl-9 h-8 text-xs border-zinc-200 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('repeat')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterType === 'repeat'
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            Repeat Buyers (≥2)
          </button>
          <button
            onClick={() => setFilterType('single')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterType === 'single'
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            First-Time (1)
          </button>
          <button
            onClick={() => setFilterType('zero')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterType === 'zero'
                ? 'bg-zinc-900 text-white'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            Registered Only (0)
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <Card className="border-zinc-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-9 h-9 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-zinc-900">No customers found</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {searchTerm
                  ? 'No registered customers match your search criteria.'
                  : 'Customer registrations and purchases will appear here automatically.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 bg-zinc-50/70">
                    <TableHead className="text-xs font-semibold text-zinc-900">Customer Name</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-900">Phone</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-900">Total Orders Placed</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-900">Lifetime Spent</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-900">Last Order Date</TableHead>
                    <TableHead className="text-xs font-semibold text-zinc-900 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((cust) => {
                    const initials = cust.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <TableRow key={cust.id} className="border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                        {/* Customer Name */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-xs text-zinc-800 shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 truncate">
                                {cust.name}
                              </p>
                              <p className="text-[11px] text-zinc-400 truncate">
                                {cust.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="text-xs font-mono text-zinc-700">
                          {cust.phone}
                        </TableCell>

                        {/* Total Orders Placed */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-900">
                              {cust.totalOrdersPlaced}
                            </span>
                            {cust.totalOrdersPlaced >= 2 && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Repeat Buyer
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Lifetime Spent */}
                        <TableCell className="text-xs font-semibold text-zinc-900 font-mono">
                          {formatCurrency(cust.lifetimeSpent)}
                        </TableCell>

                        {/* Last Order Date */}
                        <TableCell className="text-xs text-zinc-500">
                          {cust.lastOrderDate ? formatDate(cust.lastOrderDate) : 'No orders yet'}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomer(cust)}
                            className="text-xs h-7 px-2.5 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-zinc-500" /> View Breakdown
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-none flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-zinc-200 rounded-xl max-w-2xl w-full shadow-lg overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 flex items-start justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedCustomer.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-zinc-400" /> {selectedCustomer.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-400" /> {selectedCustomer.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" /> Joined {formatDate(selectedCustomer.registeredAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg border border-zinc-200 bg-[#FAFAFA]">
                <div>
                  <p className="text-[11px] text-zinc-500 font-medium">Lifetime Spent</p>
                  <p className="text-base font-bold text-zinc-900 font-mono mt-0.5">
                    {formatCurrency(selectedCustomer.lifetimeSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 font-medium">Total Orders Placed</p>
                  <p className="text-base font-bold text-zinc-900 mt-0.5">
                    {selectedCustomer.totalOrdersPlaced}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-500 font-medium">Average Order Value</p>
                  <p className="text-base font-bold text-zinc-900 font-mono mt-0.5">
                    {selectedCustomer.totalOrdersPlaced > 0
                      ? formatCurrency(selectedCustomer.lifetimeSpent / selectedCustomer.totalOrdersPlaced)
                      : formatCurrency(0)}
                  </p>
                </div>
              </div>

              {/* Requirement: Displays top 3 most frequently ordered items by that customer to help the admin understand individual buyer behavior */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-700" /> Top 3 Frequently Ordered Items
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Individual buyer behavior & recurring purchase preferences
                    </p>
                  </div>
                </div>

                {selectedCustomer.top3Items.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-zinc-200 text-center text-xs text-zinc-400">
                    No orders placed yet. Product frequency will calculate once orders are submitted.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedCustomer.top3Items.map((prod, idx) => (
                      <div
                        key={prod.productId}
                        className="p-3 rounded-lg border border-zinc-200 bg-white space-y-2 flex flex-col justify-between"
                      >
                        <div className="flex items-start gap-2.5">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.title}
                              className="w-10 h-10 rounded object-cover border border-zinc-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0 border border-zinc-200">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">
                              #{idx + 1} Favorite
                            </span>
                            <p className="text-xs font-semibold text-zinc-900 truncate" title={prod.title}>
                              {prod.title}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800">
                            {prod.totalQuantity} units bought
                          </span>
                          <span className="font-mono font-semibold text-zinc-900">
                            {formatCurrency(prod.totalSpent)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirement: Shows full purchase breakdown for a selected customer */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-zinc-700" /> Full Purchase Breakdown ({selectedCustomer.orders.length} Orders)
                </h4>

                {selectedCustomer.orders.length === 0 ? (
                  <div className="p-6 rounded-lg border border-zinc-200 text-center text-xs text-zinc-500 bg-zinc-50">
                    This customer has not placed any orders yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3"
                      >
                        {/* Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-zinc-900">
                              #{ord.id.slice(0, 8)}
                            </span>
                            <span className={getStatusBadge(ord.status)}>
                              {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-zinc-500">
                            {formatDate(ord.createdAt)}
                          </span>
                        </div>

                        {/* Order Items List */}
                        <div className="divide-y divide-zinc-100">
                          {ord.items.map((item) => (
                            <div key={item.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-8 h-8 rounded object-cover border border-zinc-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                                    <Package className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-zinc-900 truncate">
                                    {item.title}
                                  </p>
                                  <span className="text-[11px] text-zinc-500">
                                    Qty: {item.quantity} × {formatCurrency(item.price)}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono font-semibold text-zinc-900 shrink-0">
                                {formatCurrency(item.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer */}
                        <div className="pt-2.5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600 bg-zinc-50/50 p-2.5 rounded">
                          <div className="flex items-center gap-1.5 text-zinc-600">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-xs">{ord.shippingAddress}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-zinc-500 text-[11px]">{ord.paymentMethod}</span>
                            <div className="text-xs font-bold text-zinc-900 font-mono">
                              Total: {formatCurrency(ord.totalAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomer(null)}
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
