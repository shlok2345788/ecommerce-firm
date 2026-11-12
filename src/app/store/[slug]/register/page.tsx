'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  Store,
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerRegisterPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [storeData, setStoreData] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [additionalPhone, setAdditionalPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        const res = await fetch(`/api/store/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setStoreData(data.store);
        }
      } catch (e) {
        console.error('Failed to load store metadata:', e);
      }
    }
    if (slug) loadStore();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (gstNumber && gstNumber.trim().length !== 15) {
      setError('GST number must be 15 characters when provided');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/store/${slug}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          additionalPhone,
          email,
          address,
          pinCode,
          gstNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setApplicationId(data.applicationId);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const copyAppId = () => {
    if (!applicationId) return;
    navigator.clipboard.writeText(applicationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 bg-zinc-50/60">
      <div className="w-full max-w-lg space-y-6">
        {/* Store Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">
              {storeData?.name || 'Storefront'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Customer Registration & Verification Portal
            </p>
          </div>
        </div>

        {submitted ? (
          /* Success Screen */
          <Card className="border-emerald-200 bg-white shadow-sm animate-in fade-in duration-200">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <CardTitle className="text-lg font-bold text-zinc-900">
                Registration Submitted Successfully
              </CardTitle>
              <CardDescription className="text-xs text-zinc-600 max-w-md mx-auto pt-1 leading-relaxed">
                Your registration has been submitted successfully. The store administrator will verify your details and share your login credentials once approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
                <p className="text-xs text-zinc-500 font-medium">Application Reference ID</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-bold text-zinc-900 tracking-wider">
                    {applicationId}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyAppId}
                    className="h-8 text-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy ID
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Please save this reference number. Login credentials will be sent to <strong className="text-zinc-700">{email}</strong>.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Link href={`/store/${slug}`} className="flex-1">
                  <Button variant="default" className="w-full text-xs bg-zinc-900 hover:bg-zinc-800">
                    <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> Continue Browsing Store
                  </Button>
                </Link>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-900">
                Status: <strong>PENDING</strong>. Login is available only after approval and credential delivery.
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Registration Form */
          <Card className="border-zinc-200 bg-white shadow-sm">
            <CardHeader className="p-6 pb-4 border-b border-zinc-100">
              <CardTitle className="text-base font-bold text-zinc-900">
                Register as a Verified Customer
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500 leading-relaxed">
                Submit your business or contact details. Once verified by the store admin, your login credentials will be delivered via email.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="pl-9 text-xs h-9"
                    />
                  </div>
                </div>

                {/* Primary & Additional Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">
                      Primary Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        required
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile number"
                        className="pl-9 text-xs h-9 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">
                      Additional Phone <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="tel"
                        maxLength={10}
                        value={additionalPhone}
                        onChange={(e) => setAdditionalPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Alternate phone number"
                        className="pl-9 text-xs h-9 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@domain.com"
                      className="pl-9 text-xs h-9"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Your approved credentials will be delivered to this email address.
                  </p>
                </div>

                {/* Complete Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">
                    Complete Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Building/Shop No, Street, Landmark, City, State"
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                {/* PIN Code & GST Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">
                      PIN Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit PIN code"
                      className="text-xs h-9 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">
                      GST Number <span className="text-zinc-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        maxLength={15}
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        placeholder="15-digit GSTIN (if applicable)"
                        className="pl-9 text-xs h-9 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full text-xs font-medium h-10 bg-zinc-900 hover:bg-zinc-800 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting Application...
                      </>
                    ) : (
                      <>
                        Submit Customer Registration <ArrowRight className="w-4 h-4 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>

              <div className="pt-3 border-t border-zinc-100 text-center">
                <p className="text-xs text-zinc-500">
                  Already have an approved account?{' '}
                  <Link
                    href={`/store/${slug}/login`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
