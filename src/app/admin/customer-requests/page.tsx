'use client';

import React, { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
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
  FileText,
  UserCheck,
  RotateCcw,
  Building2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { validatePasswordStrength } from '@/lib/registrationValidators';

export default function CustomerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    pending: 0,
    underReview: 0,
    additionalInfo: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Approve Modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approvePasswordOption, setApprovePasswordOption] = useState<'auto' | 'manual'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [customLoginId, setCustomLoginId] = useState('');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Reject Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Request Info Modal
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [requestingInfo, setRequestingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Success / Credential Display Modal
  const [credentialModalData, setCredentialModalData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/customer-requests?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
        setMetrics(data.metrics || {});
      }
    } catch (e) {
      console.error('Failed to load customer requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const openDetailModal = async (reqItem: any) => {
    setSelectedReq(reqItem);
    setAdminNotes(reqItem.adminNotes || '');
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/admin/customer-requests/${reqItem.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReq(data.request);
        setAdminNotes(data.request.adminNotes || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const saveAdminNotes = async () => {
    if (!selectedReq) return;
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/customer-requests/${selectedReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNotesSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    setApproving(true);
    setApproveError(null);

    if (approvePasswordOption === 'manual') {
      const strength = validatePasswordStrength(customPassword);
      if (!strength.valid) {
        setApproveError(strength.errors.join(', '));
        setApproving(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/customer-requests/${selectedReq.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordOption: approvePasswordOption,
          customPassword: approvePasswordOption === 'manual' ? customPassword : undefined,
          customLoginId: customLoginId.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Approval failed');
      }

      setApproveModalOpen(false);
      setSelectedReq(null);
      setCredentialModalData(data.customer);
      fetchRequests();
    } catch (err: any) {
      setApproveError(err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    if (!rejectionReason.trim()) {
      setRejectError('Please provide a mandatory rejection reason for the applicant');
      return;
    }

    setRejecting(true);
    setRejectError(null);

    try {
      const res = await fetch(`/api/admin/customer-requests/${selectedReq.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Rejection failed');
      }

      setRejectModalOpen(false);
      setSelectedReq(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err: any) {
      setRejectError(err.message);
    } finally {
      setRejecting(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!selectedReq) return;
    if (!infoMessage.trim()) {
      setInfoError('Please provide the specific information requested from applicant');
      return;
    }

    setRequestingInfo(true);
    setInfoError(null);

    try {
      const res = await fetch(`/api/admin/customer-requests/${selectedReq.id}/request-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: infoMessage }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request info');
      }

      setInfoModalOpen(false);
      setSelectedReq(null);
      setInfoMessage('');
      fetchRequests();
    } catch (err: any) {
      setInfoError(err.message);
    } finally {
      setRequestingInfo(false);
    }
  };

  const handleResendCredentials = async (reqId: string) => {
    if (!confirm('Reissue and resend new temporary credentials to this customer?')) return;

    try {
      const res = await fetch(`/api/admin/customer-requests/${reqId}/resend-credentials`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setCredentialModalData(data.credentials);
        fetchRequests();
      } else {
        alert(data.error || 'Failed to resend credentials');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Under Review
          </Badge>
        );
      case 'ADDITIONAL_INFO_REQUIRED':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
            <HelpCircle className="w-3 h-3 mr-1" /> Info Requested
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Customer Registration Requests
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Review applicant identities, verify details, and issue secure login credentials for your storefront
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, app ID..."
            className="pl-9 h-9 text-xs"
          />
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="p-4 cursor-pointer hover:border-zinc-300 transition-colors" onClick={() => setStatusFilter('ALL')}>
          <div className="text-[11px] font-medium text-zinc-500">Total Applications</div>
          <div className="text-xl font-bold text-zinc-900 mt-1">{metrics.total || 0}</div>
        </Card>
        <Card className={`p-4 cursor-pointer hover:border-amber-300 transition-colors ${statusFilter === 'PENDING' ? 'border-amber-400 bg-amber-50/20' : ''}`} onClick={() => setStatusFilter('PENDING')}>
          <div className="text-[11px] font-medium text-amber-700">Pending Review</div>
          <div className="text-xl font-bold text-amber-800 mt-1">{metrics.pending || 0}</div>
        </Card>
        <Card className={`p-4 cursor-pointer hover:border-purple-300 transition-colors ${statusFilter === 'ADDITIONAL_INFO_REQUIRED' ? 'border-purple-400 bg-purple-50/20' : ''}`} onClick={() => setStatusFilter('ADDITIONAL_INFO_REQUIRED')}>
          <div className="text-[11px] font-medium text-purple-700">Info Requested</div>
          <div className="text-xl font-bold text-purple-800 mt-1">{metrics.additionalInfo || 0}</div>
        </Card>
        <Card className={`p-4 cursor-pointer hover:border-emerald-300 transition-colors ${statusFilter === 'APPROVED' ? 'border-emerald-400 bg-emerald-50/20' : ''}`} onClick={() => setStatusFilter('APPROVED')}>
          <div className="text-[11px] font-medium text-emerald-700">Approved Customers</div>
          <div className="text-xl font-bold text-emerald-800 mt-1">{metrics.approved || 0}</div>
        </Card>
        <Card className={`p-4 cursor-pointer hover:border-red-300 transition-colors ${statusFilter === 'REJECTED' ? 'border-red-400 bg-red-50/20' : ''}`} onClick={() => setStatusFilter('REJECTED')}>
          <div className="text-[11px] font-medium text-red-700">Rejected</div>
          <div className="text-xl font-bold text-red-800 mt-1">{metrics.rejected || 0}</div>
        </Card>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone / Contact</TableHead>
              <TableHead>Location & Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-7 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-xs text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UserCheck className="w-8 h-8 text-zinc-300" />
                    <span>No customer registration requests found matching criteria.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((reqItem) => (
                <TableRow key={reqItem.id} className="hover:bg-zinc-50/60">
                  <TableCell className="font-mono text-xs font-semibold text-zinc-900">
                    {reqItem.applicationId}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs text-zinc-900">{reqItem.fullName}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{reqItem.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-mono font-medium text-zinc-800">{reqItem.phone}</div>
                    {reqItem.additionalPhone && (
                      <div className="text-[11px] text-zinc-400 font-mono">Alt: {reqItem.additionalPhone}</div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-xs text-zinc-800 truncate" title={reqItem.address}>
                      {reqItem.address}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">PIN: {reqItem.pinCode}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(reqItem.status)}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {formatDate(reqItem.submittedAt || reqItem.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(reqItem)}
                        className="h-7 text-xs px-2.5"
                      >
                        Review
                      </Button>

                      {reqItem.status === 'APPROVED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendCredentials(reqItem.id)}
                          className="h-7 text-xs px-2 text-zinc-600 hover:text-zinc-900"
                          title="Reissue / Resend Credentials"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reissue
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review & Details Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Customer Application: {selectedReq.applicationId}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getStatusBadge(selectedReq.status)}
                    <span className="text-[11px] text-zinc-400">· Submitted {formatDate(selectedReq.submittedAt || selectedReq.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Applicant Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-zinc-50 border border-zinc-200">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Customer Full Name</p>
                  <p className="text-sm font-bold text-zinc-900 mt-0.5">{selectedReq.fullName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Primary Mobile</p>
                  <p className="text-sm font-mono font-bold text-zinc-900 mt-0.5">{selectedReq.phone}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Email Address</p>
                  <p className="text-xs font-mono text-zinc-800 mt-0.5">{selectedReq.email}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Additional Phone</p>
                  <p className="text-xs font-mono text-zinc-800 mt-0.5">{selectedReq.additionalPhone || 'None'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">Delivery / Business Address</p>
                  <p className="text-xs text-zinc-900 mt-0.5">{selectedReq.address}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">PIN Code</p>
                  <p className="text-xs font-mono text-zinc-800 mt-0.5">{selectedReq.pinCode}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase">GST Number</p>
                  <p className="text-xs font-mono text-zinc-800 mt-0.5">{selectedReq.gstNumber || 'Not provided'}</p>
                </div>
              </div>

              {/* Status History / Feedback if any */}
              {selectedReq.rejectionReason && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 space-y-1">
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-600" /> Recorded Rejection Reason:
                  </p>
                  <p className="text-xs">{selectedReq.rejectionReason}</p>
                </div>
              )}

              {selectedReq.additionalInfoRequest && (
                <div className="p-3.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 space-y-1">
                  <p className="font-semibold text-xs flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-purple-600" /> Information Requested from Applicant:
                  </p>
                  <p className="text-xs">{selectedReq.additionalInfoRequest}</p>
                </div>
              )}

              {/* Internal Admin Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Internal Admin Notes (Private)</label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add confidential store admin notes about this applicant..."
                  className="w-full p-2.5 rounded-md border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveAdminNotes}
                  disabled={notesSaving}
                  className="h-7 text-xs"
                >
                  {notesSaving ? 'Saving Notes...' : 'Save Notes'}
                </Button>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReq(null)}
                className="text-xs"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {selectedReq.status !== 'APPROVED' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInfoModalOpen(true)}
                      className="text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      <HelpCircle className="w-3.5 h-3.5 mr-1" /> Request Info
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRejectModalOpen(true)}
                      className="text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setApproveModalOpen(true)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & Issue Credentials
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve & Issue Credentials Modal */}
      {approveModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-zinc-900">Approve Customer Registration</h3>
              </div>
              <button onClick={() => setApproveModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Approving <strong className="text-zinc-900">{selectedReq.fullName}</strong> will create a customer account tied to this store, generate temporary credentials, and dispatch an email.
            </p>

            {approveError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                {approveError}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700">Temporary Password Option</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApprovePasswordOption('auto')}
                    className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                      approvePasswordOption === 'auto'
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Auto-Generate
                    <span className="block text-[10px] opacity-80 mt-0.5">Secure 10-char random</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovePasswordOption('manual')}
                    className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                      approvePasswordOption === 'manual'
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    Custom Password
                    <span className="block text-[10px] opacity-80 mt-0.5">Define manually</span>
                  </button>
                </div>
              </div>

              {approvePasswordOption === 'manual' && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-zinc-700">Set Temporary Password</label>
                  <Input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                    className="text-xs h-9"
                  />
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-zinc-700">
                  Custom Customer Login ID <span className="text-zinc-400 font-normal">(Optional)</span>
                </label>
                <Input
                  type="text"
                  value={customLoginId}
                  onChange={(e) => setCustomLoginId(e.target.value)}
                  placeholder={`Default: cust_${selectedReq.phone}`}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApproveModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={approving}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {approving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Provisioning...
                  </>
                ) : (
                  'Confirm & Send Credentials'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-bold text-zinc-900">Reject Customer Registration</h3>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Provide a mandatory reason for rejecting <strong className="text-zinc-900">{selectedReq.fullName}</strong>. This explanation will be dispatched to their registered email.
            </p>

            {rejectError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                {rejectError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Mandatory Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete address verification, out of serviceable delivery pin code, duplicate profile..."
                className="w-full p-2.5 rounded-md border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={rejecting}
                className="text-xs"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Rejecting...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {infoModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-zinc-900">Request Additional Information</h3>
              </div>
              <button onClick={() => setInfoModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Specify what additional clarification or documentation is required from <strong className="text-zinc-900">{selectedReq.fullName}</strong>.
            </p>

            {infoError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
                {infoError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Requested Information</label>
              <textarea
                required
                rows={3}
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                placeholder="e.g. Please clarify your shop number / landmark or provide your GST certificate..."
                className="w-full p-2.5 rounded-md border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInfoModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRequestInfo}
                disabled={requestingInfo}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
              >
                {requestingInfo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending...
                  </>
                ) : (
                  'Send Info Request'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credential Generated Success Modal */}
      {credentialModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white border border-zinc-200 rounded-xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Key className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-zinc-900">Customer Credentials Issued</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Credentials dispatched to <strong className="text-zinc-800">{credentialModalData.email}</strong>. You may also copy them below:
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-left space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400">Login ID:</span>
                <p className="font-mono font-bold text-zinc-900">{credentialModalData.loginId}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-zinc-400">Temporary Password:</span>
                <div className="flex items-center justify-between mt-0.5">
                  <code className="font-mono font-bold text-sm bg-amber-100/80 px-2 py-0.5 rounded text-amber-900">
                    {credentialModalData.temporaryPassword}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialModalData.temporaryPassword);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              className="w-full text-xs"
              onClick={() => setCredentialModalData(null)}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

