'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Loader2,
  Building2,
  Send,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function TrackRegistrationContent() {
  const searchParams = useSearchParams();
  const queryAppId = searchParams.get('appId') || '';
  const queryId = searchParams.get('id') || '';

  const [applicationId, setApplicationId] = useState(queryAppId);
  const [identifier, setIdentifier] = useState(queryId); // email or phone
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<any>(null);

  // Response form states when status === ADDITIONAL_INFO_REQUIRED
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setResponseSuccess(null);

    if (!applicationId.trim() || !identifier.trim()) {
      setError('Please provide both your Application ID and registered email or phone');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/register/track?applicationId=${encodeURIComponent(applicationId.trim())}&identifier=${encodeURIComponent(identifier.trim())}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve application');
      }

      setApplication(data.application);
    } catch (err: any) {
      setApplication(null);
      setError(err.message || 'Could not find a registration matching these details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryAppId && queryId) {
      handleSearch();
    }
  }, [queryAppId, queryId]);

  const handleSendAdditionalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseMessage.trim()) return;

    setResponding(true);
    setResponseSuccess(null);
    try {
      const res = await fetch('/api/register/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.applicationId,
          identifier,
          responseMessage: responseMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit response');

      setResponseSuccess(data.message);
      setResponseMessage('');
      // Refresh status
      handleSearch();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResponding(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 gap-1 text-xs py-1 px-2.5">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            Pending Administrative Review
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 gap-1 text-xs py-1 px-2.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Currently Under Review
          </Badge>
        );
      case 'ADDITIONAL_INFO_REQUIRED':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-800 border-orange-300 gap-1 text-xs py-1 px-2.5">
            <HelpCircle className="w-3.5 h-3.5 text-orange-600" />
            Additional Information Required
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 gap-1 text-xs py-1 px-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Registration Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300 gap-1 text-xs py-1 px-2.5">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Application Not Approved
          </Badge>
        );
      case 'SUSPENDED':
        return (
          <Badge variant="outline" className="bg-zinc-100 text-zinc-800 border-zinc-400 gap-1 text-xs py-1 px-2.5">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-600" />
            Store Account Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/70 text-zinc-900 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-zinc-900">OmniStore</span>
              <span className="text-xs text-zinc-400 font-normal ml-1.5 hidden sm:inline">| Application Tracking</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/register" className="text-xs text-zinc-600 hover:text-zinc-900 font-medium">
              New Registration
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs">
                Console Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Track Store Registration Status
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto">
            Check the real-time review progress of your business registration application.
          </p>
        </div>

        {/* Search Card */}
        <Card className="border-zinc-200/90 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Application ID</label>
                  <Input
                    type="text"
                    required
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value.toUpperCase())}
                    placeholder="e.g. REG-20261111-XXXX"
                    className="text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Registered Email or Phone</label>
                  <Input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email or 10-digit mobile"
                    className="text-xs"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full text-xs font-medium">
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Checking Application Records...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 mr-1.5" /> Track Application Status
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {responseSuccess && (
          <div className="flex items-center gap-2 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{responseSuccess}</span>
          </div>
        )}

        {/* Application Details Card */}
        {application && (
          <Card className="border-zinc-200/90 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <CardHeader className="pb-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-zinc-600" />
                  {application.storeName}
                </CardTitle>
                <CardDescription className="text-xs font-mono mt-0.5">
                  ID: {application.applicationId}
                </CardDescription>
              </div>

              <div>{renderStatusBadge(application.status)}</div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5 text-xs">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-3.5 rounded-lg border border-zinc-200/80">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Owner / Applicant</span>
                  <span className="font-semibold text-zinc-900">{application.ownerName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">Business Type</span>
                  <span className="font-medium text-zinc-800">{application.businessType}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">Registered Email</span>
                  <span className="font-medium text-zinc-800">{application.email}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">Primary Contact</span>
                  <span className="font-medium text-zinc-800">+91 {application.primaryPhone}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">Location</span>
                  <span className="font-medium text-zinc-800">{application.city}, {application.state}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">Submission Date</span>
                  <span className="font-medium text-zinc-800">
                    {new Date(application.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Status Specific Advice */}
              {application.status === 'PENDING' && (
                <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 space-y-1">
                  <p className="font-semibold text-xs">Awaiting Administrative Scrutiny</p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Your application is queued in our review backlog. You do not need to take any action right now. Our compliance team reviews business registrations in the order received.
                  </p>
                </div>
              )}

              {application.status === 'UNDER_REVIEW' && (
                <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                  <p className="font-semibold text-xs">Currently Under Active Review</p>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    An administrator is actively verifying your GST credentials and business location. Once approved, your login credentials will be dispatched to your email.
                  </p>
                </div>
              )}

              {/* Additional Information Request Box & Response Form */}
              {application.status === 'ADDITIONAL_INFO_REQUIRED' && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 space-y-3">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs text-orange-900">Administrator Inquiry:</p>
                      <p className="text-xs text-orange-800 mt-1 leading-relaxed bg-white p-2.5 rounded border border-orange-200">
                        {application.additionalInfoRequest}
                      </p>
                    </div>
                  </div>

                  {application.applicantResponse ? (
                    <div className="p-2.5 rounded bg-white border border-zinc-200 text-zinc-700">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase block">Your Submitted Reply:</span>
                      <p className="text-xs mt-0.5">{application.applicantResponse}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendAdditionalInfo} className="space-y-2 pt-1">
                      <label className="text-[11px] font-semibold text-zinc-700 block">
                        Submit Your Response / Clarification:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Provide the requested details or documentation clarifications..."
                        className="w-full text-xs p-2.5 border border-zinc-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
                      />
                      <Button
                        type="submit"
                        disabled={responding || !responseMessage.trim()}
                        className="text-xs font-semibold h-8"
                      >
                        {responding ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Clarification
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {application.status === 'APPROVED' && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs">Store Provisioned & Active</p>
                      <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                        Your registration has been approved. Your temporary credentials were securely emailed to <strong>{application.email}</strong>.
                      </p>
                    </div>
                  </div>
                  <Link href="/login" className="inline-block">
                    <Button size="sm" className="text-xs font-semibold bg-emerald-700 hover:bg-emerald-800">
                      Go to Console Login <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              )}

              {application.status === 'REJECTED' && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-950 space-y-2">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-xs">Application Decision: Rejected</p>
                      {application.rejectionReason && (
                        <div className="mt-2 p-2.5 rounded bg-white border border-red-200 text-xs text-red-900 leading-relaxed">
                          <span className="font-semibold block text-[10px] text-red-600 uppercase">Reason for Rejection:</span>
                          {application.rejectionReason}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 pt-1">
                    If you have questions regarding this decision, you may contact platform administration.
                  </p>
                </div>
              )}

              {application.status === 'SUSPENDED' && (
                <div className="p-4 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-900 space-y-1">
                  <p className="font-semibold text-xs text-red-700">Account Under Suspension</p>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    Operations for this store have been suspended by platform compliance. Please contact administration directly to resolve compliance requirements.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        OmniStore Commercial E-Commerce Platform · Merchant Governance & Store Onboarding
      </footer>
    </div>
  );
}

export default function TrackRegistrationPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-8" />}>
      <TrackRegistrationContent />
    </Suspense>
  );
}
