'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Building2,
  Eye,
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Key,
  Send,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Lock,
  FileText,
  UserCheck,
  UserX,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { validatePasswordStrength } from '@/lib/registrationValidators';

export default function StoreRegistrationRequestsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    pending: 0,
    underReview: 0,
    additionalInfo: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected registration for details modal
  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Modals
  const [actionModal, setActionModal] = useState<
    'NONE' | 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | 'ACTIVATE' | 'RESEND'
  >('NONE');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Approve options
  const [passwordOption, setPasswordOption] = useState<'auto' | 'manual'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [customLoginId, setCustomLoginId] = useState('');
  const [approvedCredentials, setApprovedCredentials] = useState<any>(null);
  const [credCopied, setCredCopied] = useState(false);

  // Reject options
  const [rejectionReason, setRejectionReason] = useState('');

  // Request info options
  const [requestInfoMessage, setRequestInfoMessage] = useState('');

  // Suspend options
  const [suspendReason, setSuspendReason] = useState('');

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/registrations?status=${encodeURIComponent(statusFilter)}&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setRegistrations(data.registrations || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to load registrations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRegistrations();
  };

  const openDetails = async (regId: string) => {
    setDetailLoading(true);
    setActionError(null);
    setActionSuccess(null);
    setApprovedCredentials(null);
    try {
      const res = await fetch(`/api/admin/registrations/${regId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedReg(data.registration);
        setAdminNotes(data.registration.adminNotes || '');
        setCustomLoginId(`owner_${data.registration.storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
      }
    } catch (e) {
      console.error('Failed to load registration details', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReg) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (res.ok) {
        setActionSuccess('Admin notes updated');
        fetchRegistrations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReg) return;
    setActionLoading(true);
    setActionError(null);

    if (passwordOption === 'manual') {
      const strength = validatePasswordStrength(customPassword);
      if (!strength.valid) {
        setActionError(`Password validation: ${strength.errors.join(', ')}`);
        setActionLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordOption,
          customPassword: passwordOption === 'manual' ? customPassword : undefined,
          customLoginId: customLoginId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve registration');
      }

      setApprovedCredentials({
        storeName: data.store.name,
        storeSlug: data.store.slug,
        storeId: data.store.id,
        loginId: data.account.loginId,
        temporaryPassword: data.account.temporaryPassword,
        emailSent: data.emailDelivery?.sent,
      });

      setActionSuccess('Registration approved! Store provisioned successfully.');
      setActionModal('NONE');
      openDetails(selectedReg.id);
      fetchRegistrations();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReg || !rejectionReason.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject registration');

      setActionSuccess('Registration rejected and applicant notified via email.');
      setActionModal('NONE');
      setRejectionReason('');
      openDetails(selectedReg.id);
      fetchRegistrations();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedReg || !requestInfoMessage.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}/request-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestMessage: requestInfoMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request additional info');

      setActionSuccess('Additional information inquiry dispatched to applicant.');
      setActionModal('NONE');
      setRequestInfoMessage('');
      openDetails(selectedReg.id);
      fetchRegistrations();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedReg) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspendReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to suspend store');

      setActionSuccess('Store account suspended.');
      setActionModal('NONE');
      setSuspendReason('');
      openDetails(selectedReg.id);
      fetchRegistrations();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedReg) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}/activate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reactivate store');

      setActionSuccess('Store account reactivated.');
      setActionModal('NONE');
      openDetails(selectedReg.id);
      fetchRegistrations();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendCredentials = async () => {
    if (!selectedReg) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/registrations/${selectedReg.id}/resend-credentials`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend credentials');

      setApprovedCredentials({
        storeName: selectedReg.storeName,
        storeSlug: selectedReg.createdStore?.slug,
        storeId: selectedReg.createdStore?.id,
        loginId: data.loginId,
        temporaryPassword: data.temporaryPassword,
        emailSent: data.emailSent,
      });

      setActionSuccess('Fresh temporary credentials generated and emailed.');
      setActionModal('NONE');
      openDetails(selectedReg.id);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyCreds = () => {
    if (!approvedCredentials) return;
    const text = `OmniStore Credentials\nStore: ${approvedCredentials.storeName}\nLogin ID: ${approvedCredentials.loginId}\nTemporary Password: ${approvedCredentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCredCopied(true);
    setTimeout(() => setCredCopied(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-medium text-[11px]">Pending Review</Badge>;
      case 'UNDER_REVIEW':
        return <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-medium text-[11px]">Under Review</Badge>;
      case 'ADDITIONAL_INFO_REQUIRED':
        return <Badge className="bg-orange-100 text-orange-900 border-orange-300 font-medium text-[11px]">Info Required</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-medium text-[11px]">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-900 border-red-300 font-medium text-[11px]">Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-zinc-200 text-zinc-800 border-zinc-400 font-medium text-[11px]">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              Store Registration Requests
            </h1>
            {metrics.pending > 0 && (
              <Badge className="bg-amber-500 text-white text-[11px] font-bold">
                {metrics.pending} New
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Scrutinize business credentials, approve store accounts, and manage merchant onboarding
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search App ID, Owner, GST..."
            className="pl-9 h-9 text-xs"
          />
        </form>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          onClick={() => setStatusFilter('ALL')}
          className={`cursor-pointer transition-all border ${statusFilter === 'ALL' ? 'border-zinc-950 bg-zinc-950 text-white' : 'hover:border-zinc-300 bg-white'}`}
        >
          <CardContent className="p-3 text-center">
            <span className={`text-[10px] uppercase font-semibold ${statusFilter === 'ALL' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Total Registrations
            </span>
            <div className="text-xl font-extrabold mt-0.5">{metrics.total}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter('PENDING')}
          className={`cursor-pointer transition-all border ${statusFilter === 'PENDING' ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-500' : 'hover:border-amber-300 bg-white'}`}
        >
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-semibold text-amber-700">Pending Review</span>
            <div className="text-xl font-extrabold mt-0.5 text-amber-900">{metrics.pending}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter('UNDER_REVIEW')}
          className={`cursor-pointer transition-all border ${statusFilter === 'UNDER_REVIEW' ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500' : 'hover:border-blue-300 bg-white'}`}
        >
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-semibold text-blue-700">Under Review</span>
            <div className="text-xl font-extrabold mt-0.5 text-blue-900">{metrics.underReview}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter('APPROVED')}
          className={`cursor-pointer transition-all border ${statusFilter === 'APPROVED' ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500' : 'hover:border-emerald-300 bg-white'}`}
        >
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-semibold text-emerald-700">Approved</span>
            <div className="text-xl font-extrabold mt-0.5 text-emerald-900">{metrics.approved}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter('REJECTED')}
          className={`cursor-pointer transition-all border ${statusFilter === 'REJECTED' ? 'border-red-600 bg-red-50 text-red-900 ring-1 ring-red-500' : 'hover:border-red-300 bg-white'}`}
        >
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-semibold text-red-700">Rejected</span>
            <div className="text-xl font-extrabold mt-0.5 text-red-900">{metrics.rejected}</div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setStatusFilter('SUSPENDED')}
          className={`cursor-pointer transition-all border ${statusFilter === 'SUSPENDED' ? 'border-zinc-900 bg-zinc-200 text-zinc-900 ring-1 ring-zinc-500' : 'hover:border-zinc-300 bg-white'}`}
        >
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-semibold text-zinc-600">Suspended</span>
            <div className="text-xl font-extrabold mt-0.5 text-zinc-900">{metrics.suspended}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50/70">
            <TableRow>
              <TableHead className="text-xs">Application ID</TableHead>
              <TableHead className="text-xs">Owner Name</TableHead>
              <TableHead className="text-xs">Store Name</TableHead>
              <TableHead className="text-xs">Primary Phone</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">GST Number</TableHead>
              <TableHead className="text-xs">Registration Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-xs text-zinc-500">
                  No store registrations found matching the current criteria.
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg) => (
                <TableRow key={reg.id} className="hover:bg-zinc-50/60 text-xs">
                  <TableCell className="font-mono font-semibold text-zinc-900">
                    {reg.applicationId}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900">{reg.ownerName}</TableCell>
                  <TableCell className="font-semibold text-zinc-950">
                    {reg.storeName}
                    <span className="block text-[10px] text-zinc-400 font-normal">{reg.businessType}</span>
                  </TableCell>
                  <TableCell className="font-mono text-zinc-700">+91 {reg.primaryPhone}</TableCell>
                  <TableCell className="text-zinc-600">{reg.email}</TableCell>
                  <TableCell className="font-mono uppercase text-zinc-700">
                    {reg.gstNumber || <span className="text-zinc-400 font-sans italic">None</span>}
                  </TableCell>
                  <TableCell className="text-zinc-600 whitespace-nowrap">
                    {new Date(reg.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(reg.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetails(reg.id)}
                      className="h-7 text-xs px-2.5"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Scrutinize
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">{selectedReg.storeName}</h3>
                  <p className="text-[11px] text-zinc-500 font-mono">App ID: {selectedReg.applicationId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedReg.status)}
                <button
                  onClick={() => setSelectedReg(null)}
                  className="w-7 h-7 rounded-md hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {actionError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {actionSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Newly Approved Credentials Card (Displayed once for backup) */}
              {approvedCredentials && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-emerald-700" /> Secure Provisioned Credentials
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyCreds}
                      className="h-6 text-[11px] px-2 bg-white"
                    >
                      {credCopied ? <Check className="w-3 h-3 text-emerald-600 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {credCopied ? 'Copied' : 'Copy Credentials'}
                    </Button>
                  </div>
                  <div className="bg-white p-3 rounded border border-emerald-200 font-mono text-[11px] space-y-1">
                    <div><span className="text-zinc-400">Store ID:</span> {approvedCredentials.storeId}</div>
                    <div><span className="text-zinc-400">Login ID:</span> <span className="font-bold text-zinc-950">{approvedCredentials.loginId}</span></div>
                    <div><span className="text-zinc-400">Temporary Password:</span> <span className="font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">{approvedCredentials.temporaryPassword}</span></div>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    {approvedCredentials.emailSent
                      ? '✓ Dispatched to registered email successfully.'
                      : '⚠ Email delivery pending or simulated. Share credentials securely with the merchant.'}
                  </p>
                </div>
              )}

              {/* Business Details Grid */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-lg border border-zinc-200/80">
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">Proprietor / Contact</span>
                  <span className="font-semibold text-zinc-900">{selectedReg.ownerName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">Business Type</span>
                  <span className="font-semibold text-zinc-900">{selectedReg.businessType}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">Registered Business Email</span>
                  <span className="font-semibold text-zinc-900">{selectedReg.email}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block font-medium">Primary Contact Number</span>
                  <span className="font-semibold text-zinc-900 font-mono">+91 {selectedReg.primaryPhone}</span>
                </div>
                {selectedReg.additionalPhones && selectedReg.additionalPhones.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-[11px] text-zinc-400 block font-medium">Additional Numbers</span>
                    <span className="font-mono text-zinc-800">
                      {selectedReg.additionalPhones.map((p: string) => `+91 ${p}`).join(', ')}
                    </span>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[11px] text-zinc-400 block font-medium">GST Identification Number</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {selectedReg.gstNumber ? (
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {selectedReg.gstNumber}
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-sans italic font-normal">Not Provided</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Full Address */}
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400 font-medium block">Registered Physical Address</span>
                <p className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-zinc-800 font-medium leading-relaxed">
                  {selectedReg.fullAddress || `${selectedReg.buildingNumber}, ${selectedReg.streetArea}, ${selectedReg.city}, ${selectedReg.state} - ${selectedReg.pinCode}, ${selectedReg.country}`}
                </p>
              </div>

              {selectedReg.businessDescription && (
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium block">Business Profile / Description</span>
                  <p className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-zinc-700 italic">
                    {selectedReg.businessDescription}
                  </p>
                </div>
              )}

              {/* Rejection / Info Requests Display */}
              {selectedReg.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-1">
                  <span className="font-bold text-[11px] text-red-700 uppercase block">Rejection Reason:</span>
                  <p className="leading-relaxed">{selectedReg.rejectionReason}</p>
                </div>
              )}

              {selectedReg.additionalInfoRequest && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-950 space-y-2">
                  <span className="font-bold text-[11px] text-orange-700 uppercase block">Requested Information:</span>
                  <p className="leading-relaxed">{selectedReg.additionalInfoRequest}</p>
                  {selectedReg.applicantResponse && (
                    <div className="mt-2 pt-2 border-t border-orange-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Applicant Reply:</span>
                      <p className="text-zinc-800 bg-white p-2 rounded mt-1">{selectedReg.applicantResponse}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Associated Provisioned Store */}
              {selectedReg.createdStore && (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Provisioned Store</span>
                    <span className="font-bold text-zinc-900">{selectedReg.createdStore.name}</span>
                    <span className="text-zinc-400 font-mono text-[11px] ml-2">(/store/{selectedReg.createdStore.slug})</span>
                  </div>
                  <Badge variant="outline" className={selectedReg.createdStore.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}>
                    Store {selectedReg.createdStore.status}
                  </Badge>
                </div>
              )}

              {/* Admin Notes */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700">Internal Admin Notes</label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="h-6 text-[11px] px-2"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private internal notes regarding applicant scrutiny, tax verification, or follow-ups..."
                  className="w-full text-xs p-2 border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              {/* SUB-MODAL ACTION FORMS */}
              {actionModal === 'APPROVE' && (
                <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    Approve Store & Issue Credentials
                  </h4>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    This will provision a new Store, create a store admin account, generate a temporary password, and email login credentials to <strong>{selectedReg.email}</strong>.
                  </p>

                  <div className="space-y-2 bg-white p-3 rounded-lg border border-emerald-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-700">Login ID / Username</label>
                      <Input
                        type="text"
                        value={customLoginId}
                        onChange={(e) => setCustomLoginId(e.target.value)}
                        placeholder="owner_username"
                        className="text-xs font-mono h-8"
                      />
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] font-semibold text-zinc-700 block">Password Generation Mode</label>
                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="pwdOption"
                            checked={passwordOption === 'auto'}
                            onChange={() => setPasswordOption('auto')}
                          />
                          <span>Auto-generate secure 12-char password</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="pwdOption"
                            checked={passwordOption === 'manual'}
                            onChange={() => setPasswordOption('manual')}
                          />
                          <span>Enter manually</span>
                        </label>
                      </div>
                    </div>

                    {passwordOption === 'manual' && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] font-semibold text-zinc-700">Temporary Password</label>
                        <Input
                          type="password"
                          value={customPassword}
                          onChange={(e) => setCustomPassword(e.target.value)}
                          placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol"
                          className="text-xs h-8"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActionModal('NONE')}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold h-8 px-4"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Confirm Approval & Provision
                    </Button>
                  </div>
                </div>
              )}

              {actionModal === 'REJECT' && (
                <div className="p-4 rounded-xl border border-red-300 bg-red-50/70 space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-red-950 text-xs flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-700" />
                    Reject Registration Application
                  </h4>
                  <p className="text-[11px] text-red-900">
                    A rejection notice with your specified reason will be emailed to the applicant.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-800">Mandatory Rejection Reason *</label>
                    <textarea
                      rows={2}
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Invalid GST identification, unverified business physical address, or duplicate submission..."
                      className="w-full text-xs p-2 border border-red-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActionModal('NONE')}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReject}
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="bg-red-700 hover:bg-red-800 text-white text-xs font-semibold h-8 px-4"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {actionModal === 'REQUEST_INFO' && (
                <div className="p-4 rounded-xl border border-orange-300 bg-orange-50/70 space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-orange-950 text-xs flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-orange-700" />
                    Request Additional Information from Applicant
                  </h4>
                  <p className="text-[11px] text-orange-900">
                    The applicant will receive an email notification instructing them to submit clarifications via their tracking portal.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-800">Inquiry Message *</label>
                    <textarea
                      rows={2}
                      required
                      value={requestInfoMessage}
                      onChange={(e) => setRequestInfoMessage(e.target.value)}
                      placeholder="Specify what additional documentation or clarifications are needed..."
                      className="w-full text-xs p-2 border border-orange-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActionModal('NONE')}
                      className="text-xs h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleRequestInfo}
                      disabled={actionLoading || !requestInfoMessage.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold h-8 px-4"
                    >
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Dispatch Inquiry
                    </Button>
                  </div>
                </div>
              )}

              {actionModal === 'SUSPEND' && (
                <div className="p-4 rounded-xl border border-zinc-400 bg-zinc-100 space-y-3 animate-in fade-in">
                  <h4 className="font-bold text-zinc-950 text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-zinc-700" />
                    Suspend Store Account
                  </h4>
                  <p className="text-[11px] text-zinc-700">
                    This will immediately block storefront customer orders and disable merchant console logins.
                  </p>
                  <Input
                    type="text"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Reason for suspension (optional)"
                    className="text-xs bg-white h-8"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={() => setActionModal('NONE')} className="text-xs h-8">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSuspend} disabled={actionLoading} className="bg-zinc-900 text-white text-xs font-semibold h-8">
                      {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      Confirm Suspension
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReg(null)}
                className="text-xs h-8"
              >
                Close
              </Button>

              <div className="flex flex-wrap items-center gap-2">
                {selectedReg.status !== 'APPROVED' && selectedReg.status !== 'REJECTED' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActionModal('REQUEST_INFO')}
                      className="text-xs h-8 text-orange-700 hover:bg-orange-50 border-orange-200"
                    >
                      <HelpCircle className="w-3.5 h-3.5 mr-1" /> Request Info
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActionModal('REJECT')}
                      className="text-xs h-8 text-red-600 hover:bg-red-50 border-red-200"
                    >
                      <UserX className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setActionModal('APPROVE')}
                      className="text-xs h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" /> Approve Registration
                    </Button>
                  </>
                )}

                {selectedReg.status === 'APPROVED' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendCredentials}
                      disabled={actionLoading}
                      className="text-xs h-8"
                      title="Generate fresh temporary credentials if delivery failed"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Resend Credentials
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setActionModal('SUSPEND')}
                      className="text-xs h-8"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Suspend Store
                    </Button>
                  </>
                )}

                {selectedReg.status === 'SUSPENDED' && (
                  <Button
                    size="sm"
                    onClick={handleActivate}
                    disabled={actionLoading}
                    className="text-xs h-8 bg-zinc-900 text-white font-semibold"
                  >
                    Reactivate Store
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

